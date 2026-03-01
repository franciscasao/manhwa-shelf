import crypto from "crypto";
import type { Source, SourceIdentifier, SourceChapter, SourcePage, SourceMangaDetails } from "../types";
import { registerSource } from "../registry";

const API_BASE = "https://api.qtoon.com";
const USER_AGENT = "Mozilla/5.0";
const API_SALT = "OQlM9JBJgLWsgffb";
const IMAGE_SALT = "9tv86uBwmOYs7QZ0";

// Charset: A-Z, a-z, 2-8
const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz2345678";

function generateRandomString(length: number): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return result;
}

function md5(input: string): string {
  return crypto.createHash("md5").update(input).digest("hex");
}

function aesDecrypt(base64Data: string, key: string, iv: string): string {
  const decipher = crypto.createDecipheriv("aes-128-cbc", Buffer.from(key, "utf8"), Buffer.from(iv, "utf8"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(base64Data, "base64")), decipher.final()]);
  return decrypted.toString("utf8");
}

function decryptApiResponse<T>(data: string, ts: number, did: string): T {
  const hash1 = md5(did + String(ts));
  const hash2 = md5(hash1 + API_SALT);
  const key = hash2.slice(0, 16);
  const iv = hash2.slice(16, 32);
  const json = aesDecrypt(data, key, iv);
  return JSON.parse(json) as T;
}

function decryptImageUrl(encryptedUrl: string, did: string): string {
  const hash1 = md5(did);
  const hash2 = md5(hash1 + IMAGE_SALT);
  const key = hash2.slice(0, 16);
  const iv = hash2.slice(16, 32);
  return aesDecrypt(encryptedUrl, key, iv);
}

interface ApiEnvelope {
  ts: number;
  data: string;
}

async function apiCall<T>(endpoint: string, params: Record<string, string> = {}): Promise<{ data: T; did: string }> {
  const did = generateRandomString(32);
  const ts = Date.now();
  const searchParams = new URLSearchParams({ ...params, did, ts: String(ts) });
  const url = `${API_BASE}${endpoint}?${searchParams.toString()}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Referer: "https://qtoon.com",
      platform: "pc",
      lth: "en-UI",
      Accept: "application/json",
      did,
    },
  });
  console.log("============= res: ", res);

  if (!res.ok) {
    throw new Error(`QToon API returned ${res.status} for ${endpoint}`);
  }

  const envelope = (await res.json()) as ApiEnvelope;
  console.log("============= envelope: ", envelope);
  const data = decryptApiResponse<T>(envelope.data, envelope.ts, did);
  console.log("============= data: ", data);

  return { data, did };
}

interface EpisodeListResponse {
  episodes: Array<{
    esid: string;
    title: string;
    serialNo: number;
  }>;
}

interface EpisodeDetailResponse {
  definitions: Array<{
    token: string;
  }>;
}

interface ResourceGroupResponse {
  resources: Array<{ url: string }>;
  more: 0 | 1;
}

interface ComicDetailResponse {
  comic: {
    title: string;
    image: { thumb: { url: string } };
    author: string;
    introduction: string;
    tags: Array<{ name: string }>;
    serialStatus2: number;
  };
}

const qtoon: Source = {
  id: "qtoon",
  name: "QToon",
  baseUrl: "https://qtoon.com",

  headers: { "User-Agent": USER_AGENT },

  imageHeaders: {
    "User-Agent": USER_AGENT,
    Referer: "https://qtoon.com/",
  },

  // Placeholder — update with actual CDN domain after first successful download
  imageDomains: ["qtoon.com"],

  parseUrl(url: string): SourceIdentifier | null {
    try {
      const parsed = new URL(url);
      if (parsed.hostname !== "qtoon.com" && parsed.hostname !== "www.qtoon.com") {
        return null;
      }
      const match = parsed.pathname.match(/^\/detail\/([^/]+)/);
      if (!match) return null;
      return { sourceId: this.id, seriesId: match[1], url };
    } catch {
      return null;
    }
  },

  async fetchChapterList(seriesId: string): Promise<SourceChapter[]> {
    const { data } = await apiCall<EpisodeListResponse>("/api/w/comic/detail", { csid: seriesId });
    return (data.episodes ?? [])
      .filter((ep) => !/\bcensored\b/i.test(ep.title))
      .map(
        (ep): SourceChapter => ({
          id: ep.esid,
          number: ep.serialNo,
          title: ep.title,
          url: `https://qtoon.com/comic/${seriesId}/ep-${ep.esid}`,
          datePublished: null,
        }),
      )
      .sort((a, b) => a.number - b.number);
  },

  async fetchChapterPages(chapterUrl: string): Promise<SourcePage[]> {
    const match = chapterUrl.match(/\/comic\/[^/]+\/ep-([^/?#]+)/);
    if (!match) {
      throw new Error(`Cannot parse episode ID from URL: ${chapterUrl}`);
    }
    const esid = match[1];

    // Fetch episode definitions; the did from this call is used to decrypt image URLs
    const { data: episodeDetail, did: episodeDid } = await apiCall<EpisodeDetailResponse>(
      "/api/w/comic/episode/detail",
      { esid },
    );

    const pages: SourcePage[] = [];

    for (const def of episodeDetail.definitions ?? []) {
      let page = 0;
      while (true) {
        const { data: group } = await apiCall<ResourceGroupResponse>("/api/w/resource/group/rslv", {
          token: def.token,
          rg: String(page),
        });

        for (const resource of group.resources ?? []) {
          pages.push({ url: decryptImageUrl(resource.url, episodeDid) });
        }

        if (group.more !== 1) break;
        page++;
      }
    }

    return pages;
  },

  async fetchMangaDetails(seriesId: string): Promise<SourceMangaDetails> {
    const { data } = await apiCall<ComicDetailResponse>("/api/w/comic/detail", {
      csid: seriesId,
    });
    const comic = data.comic;

    let status: SourceMangaDetails["status"] = "unknown";
    if (comic.serialStatus2 === 101) status = "ongoing";
    else if (comic.serialStatus2 === 103) status = "completed";

    return {
      title: comic.title,
      author: comic.author,
      description: comic.introduction,
      coverUrl: comic.image.thumb.url,
      genres: (comic.tags ?? []).map((t) => t.name),
      status,
    };
  },
};

registerSource(qtoon);
export default qtoon;
