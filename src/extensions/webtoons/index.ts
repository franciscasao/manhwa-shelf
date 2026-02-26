import type {
  Source,
  SourceIdentifier,
  SourceChapter,
  SourcePage,
} from "../types";
import { registerSource } from "../registry";

const MOBILE_USER_AGENT =
  "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

type WebtoonType = "webtoon" | "canvas";

/** Encode titleId + type into a single seriesId string. */
function encodeSeriesId(titleId: string, type: WebtoonType): string {
  return `${titleId}:${type}`;
}

/** Decode seriesId back into titleId + type. */
function decodeSeriesId(seriesId: string): {
  titleId: string;
  type: WebtoonType;
} {
  const [titleId, type] = seriesId.split(":");
  return { titleId, type: (type as WebtoonType) ?? "webtoon" };
}

/**
 * Parse image URLs from a Webtoons viewer HTML page.
 * Content images use class="_images" and store URLs in the data-url attribute.
 */
function parseImageUrlsFromHtml(html: string): string[] {
  const imgTagRegex = /<img[^>]+>/gi;
  const contentImages: string[] = [];
  const allDataUrlImages: string[] = [];
  let imgMatch;

  while ((imgMatch = imgTagRegex.exec(html)) !== null) {
    const tag = imgMatch[0];

    const dataUrlMatch = tag.match(/data-url="([^"]+)"/);
    if (!dataUrlMatch) continue;

    let url = dataUrlMatch[1];
    try {
      const imgUrl = new URL(url);
      imgUrl.searchParams.delete("type");
      url = imgUrl.toString();
    } catch {
      // Use URL as-is if parsing fails
    }

    allDataUrlImages.push(url);

    if (/class="[^"]*\b_images\b/.test(tag)) {
      contentImages.push(url);
    }
  }

  return contentImages.length > 0 ? contentImages : allDataUrlImages;
}

interface WebtoonEpisodeRaw {
  episodeTitle: string;
  viewerLink: string;
  exposureDateMillis: number;
  hasBgm: boolean;
}

const webtoons: Source = {
  id: "webtoons",
  name: "Webtoons",
  baseUrl: "https://www.webtoons.com",

  headers: {
    "User-Agent": MOBILE_USER_AGENT,
    Referer: "https://m.webtoons.com/",
  },

  imageHeaders: {
    "User-Agent": MOBILE_USER_AGENT,
    Referer: "https://www.webtoons.com/",
  },

  imageDomains: [
    "webtoon-phinf.pstatic.net",
    "swebtoon-phinf.pstatic.net",
    "cdn.webtoons.com",
  ],

  parseUrl(url: string): SourceIdentifier | null {
    try {
      const parsed = new URL(url);
      if (!parsed.hostname.includes("webtoons.com")) return null;

      const titleId = parsed.searchParams.get("title_no");
      if (!titleId) return null;

      const type: WebtoonType = parsed.pathname.includes("/canvas/")
        ? "canvas"
        : "webtoon";

      return {
        sourceId: this.id,
        seriesId: encodeSeriesId(titleId, type),
        url,
      };
    } catch {
      return null;
    }
  },

  async fetchChapterList(seriesId: string): Promise<SourceChapter[]> {
    const { titleId, type } = decodeSeriesId(seriesId);
    const apiUrl = `https://m.webtoons.com/api/v1/${type}/${titleId}/episodes?pageSize=99999`;

    const res = await fetch(apiUrl, { headers: this.headers });

    if (!res.ok) {
      throw new Error(`Webtoons API returned ${res.status}`);
    }

    const json = await res.json();
    const episodes: WebtoonEpisodeRaw[] = json.result?.episodeList ?? [];

    return episodes.map(
      (ep, index): SourceChapter => ({
        id: String(index + 1),
        number: index + 1,
        title: ep.episodeTitle,
        url: ep.viewerLink.startsWith("/")
          ? `https://www.webtoons.com${ep.viewerLink}`
          : ep.viewerLink,
        datePublished: ep.exposureDateMillis || null,
      }),
    );
  },

  async fetchChapterPages(chapterUrl: string): Promise<SourcePage[]> {
    const fullUrl = chapterUrl.startsWith("/")
      ? `https://www.webtoons.com${chapterUrl}`
      : chapterUrl;

    try {
      const parsed = new URL(fullUrl);
      if (!parsed.hostname.includes("webtoons.com")) {
        throw new Error("Invalid viewer URL domain");
      }
    } catch {
      throw new Error("Invalid viewer URL");
    }

    const res = await fetch(fullUrl, { headers: this.headers });

    if (!res.ok) {
      throw new Error(`Webtoons viewer returned ${res.status}`);
    }

    const html = await res.text();
    const imageUrls = parseImageUrlsFromHtml(html);

    return imageUrls.map(
      (url): SourcePage => ({
        url,
        // imageHeaders from the source are applied automatically by the proxy
      }),
    );
  },
};

registerSource(webtoons);
export default webtoons;
