import type {
  Source,
  SourceIdentifier,
  SourceChapter,
  SourcePage,
  SourceMangaDetails,
} from "../types";
import { registerSource } from "../registry";

/**
 * Tapas (tapas.io) extension.
 *
 * Based on the Keiyoushi/Tachiyomi Tapastic extension patterns:
 * - Chapter list via paginated JSON endpoint
 * - Page images via HTML scraping (img.content__img)
 * - Manga details via HTML scraping (/series/{id}/info)
 *
 * @see https://github.com/keiyoushi/extensions-source/tree/main/src/en/tapastic
 */

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:105.0) Gecko/20100101 Firefox/105.0";

const TAPAS_HEADERS: Record<string, string> = {
  "User-Agent": USER_AGENT,
  Referer: "https://tapas.io/",
};

// -- HTML parsing helpers (regex-based, no DOM dependency) --

function extractAttr(tag: string, attr: string): string | null {
  const match = tag.match(new RegExp(`${attr}="([^"]+)"`));
  return match?.[1] ?? null;
}

function selectAll(html: string, pattern: RegExp): string[] {
  const matches: string[] = [];
  let m;
  while ((m = pattern.exec(html)) !== null) {
    matches.push(m[0]);
  }
  return matches;
}

function selectText(html: string, pattern: RegExp): string {
  const match = html.match(pattern);
  if (!match) return "";
  // Strip HTML tags from the matched content
  return match[1]?.replace(/<[^>]+>/g, "").trim() ?? "";
}

// -- Tapas-specific response types --

interface TapasEpisode {
  id: number;
  title: string;
  publish_date: string;
  free: boolean;
  unlocked: boolean;
  scheduled: boolean;
  scene: number;
}

interface TapasChapterListResponse {
  data: {
    pagination: {
      has_next: boolean;
    };
    episodes: TapasEpisode[];
  };
}

const tapas: Source = {
  id: "tapas",
  name: "Tapas",
  baseUrl: "https://tapas.io",

  headers: TAPAS_HEADERS,

  imageHeaders: {
    "User-Agent": USER_AGENT,
    Referer: "https://tapas.io/",
  },

  imageDomains: [
    "tapas.io",
    "d30womf5coomej.cloudfront.net",
  ],

  parseUrl(url: string): SourceIdentifier | null {
    try {
      const parsed = new URL(url);
      if (!parsed.hostname.includes("tapas.io")) return null;

      // Match /series/{slug-or-id}
      const match = parsed.pathname.match(/\/series\/([^/]+)/);
      if (!match) return null;

      return {
        sourceId: this.id,
        seriesId: match[1],
        url,
      };
    } catch {
      return null;
    }
  },

  async fetchChapterList(seriesId: string): Promise<SourceChapter[]> {
    const chapters: SourceChapter[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const url =
        `${this.baseUrl}/series/${seriesId}/episodes` +
        `?page=${page}` +
        `&sort=OLDEST` +
        `&since=${Date.now()}` +
        `&large=true` +
        `&last_access=0`;

      const res = await fetch(url, { headers: this.headers });

      if (!res.ok) {
        throw new Error(`Tapas chapters API returned ${res.status}`);
      }

      const json: TapasChapterListResponse = await res.json();

      for (const ep of json.data.episodes) {
        // Skip scheduled (unreleased) episodes
        if (ep.scheduled) continue;

        chapters.push({
          id: String(ep.id),
          number: ep.scene,
          title: ep.title,
          url: `${this.baseUrl}/episode/${ep.id}`,
          datePublished: ep.publish_date
            ? new Date(ep.publish_date).getTime()
            : null,
          isLocked: !ep.free && !ep.unlocked,
        });
      }

      hasMore = json.data.pagination.has_next;
      page++;
    }

    return chapters;
  },

  async fetchChapterPages(chapterUrl: string): Promise<SourcePage[]> {
    try {
      const parsed = new URL(chapterUrl);
      if (!parsed.hostname.includes("tapas.io")) {
        throw new Error("Invalid Tapas URL domain");
      }
    } catch {
      throw new Error("Invalid Tapas chapter URL");
    }

    const res = await fetch(chapterUrl, { headers: this.headers });

    if (!res.ok) {
      throw new Error(`Tapas viewer returned ${res.status}`);
    }

    const html = await res.text();

    // Extract content images: <img class="content__img" data-src="..." />
    // Matches both class="content__img" and class="content__img lazy"
    const imgTags = selectAll(
      html,
      /<img[^>]+class="[^"]*content__img[^"]*"[^>]*>/gi,
    );

    const pages: SourcePage[] = [];

    for (const tag of imgTags) {
      // Prefer data-src (lazy-loaded), fall back to src
      const url = extractAttr(tag, "data-src") ?? extractAttr(tag, "src");
      if (!url) continue;

      // Resolve relative URLs
      const absoluteUrl = url.startsWith("/")
        ? `${this.baseUrl}${url}`
        : url;

      pages.push({ url: absoluteUrl });
    }

    if (pages.length === 0) {
      throw new Error("No images found — chapter may be locked");
    }

    return pages;
  },

  async fetchMangaDetails(seriesId: string): Promise<SourceMangaDetails> {
    const url = `${this.baseUrl}/series/${seriesId}/info`;
    const res = await fetch(url, { headers: this.headers });

    if (!res.ok) {
      throw new Error(`Tapas details page returned ${res.status}`);
    }

    const html = await res.text();

    // Title: <div class="info__right"><div class="title">...</div></div>
    const title = selectText(
      html,
      /class="info__right"[^>]*>[\s\S]*?class="title"[^>]*>([^<]+)</,
    );

    // Cover image
    const thumbMatch = html.match(
      /class="[^"]*thumb[^"]*js-thumbnail[^"]*"[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"/,
    );
    const coverUrl = thumbMatch?.[1] ?? "";

    // Description
    const description = selectText(
      html,
      /class="description__body"[^>]*>([\s\S]*?)<\/(?:p|div)>/,
    );

    // Genres: <a class="genre-btn">...</a>
    const genreTags = selectAll(html, /class="genre-btn"[^>]*>[^<]+</gi);
    const genres = genreTags
      .map((tag) => tag.replace(/.*>/, "").replace(/<.*/, "").trim())
      .filter(Boolean);

    // Author: <a class="name ...">...</a> inside .creator-section
    const authorSection = html.match(
      /class="creator-section"[\s\S]*?class="name[^"]*"[^>]*>([^<]+)</,
    );
    const author = authorSection?.[1]?.trim() ?? "Unknown";

    // Status from schedule label
    const scheduleLabel = selectText(
      html,
      /class="schedule-label"[^>]*>([^<]+)</,
    );
    let status: SourceMangaDetails["status"] = "unknown";
    if (/updates/i.test(scheduleLabel)) status = "ongoing";
    else if (/completed/i.test(scheduleLabel)) status = "completed";
    else if (/hiatus/i.test(scheduleLabel)) status = "hiatus";

    return { title, author, description, coverUrl, genres, status };
  },
};

registerSource(tapas);
export default tapas;
