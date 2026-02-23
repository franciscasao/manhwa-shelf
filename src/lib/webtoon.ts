import type { AniListExternalLink } from "@/lib/anilist";
import { db } from "@/lib/db";

export interface WebtoonCache {
  titleId: string;
  type: WebtoonType;
  episodes: WebtoonEpisode[];
  fetchedAt: number;
}

export interface WebtoonEpisode {
  episodeTitle: string;
  viewerLink: string;
  exposureDateMillis: number;
  hasBgm: boolean;
}

export interface WebtoonApiResponse {
  result: {
    episodeList: WebtoonEpisode[];
  };
}

export type WebtoonType = "webtoon" | "canvas";

export interface WebtoonParams {
  titleId: string;
  type: WebtoonType;
  url: string;
}

export function parseWebtoonUrl(url: string): WebtoonParams | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("webtoons.com")) return null;

    const titleId = parsed.searchParams.get("title_no");
    if (!titleId) return null;

    const type: WebtoonType = parsed.pathname.includes("/canvas/")
      ? "canvas"
      : "webtoon";

    return { titleId, type, url };
  } catch {
    return null;
  }
}

export function findWebtoonLink(
  externalLinks: AniListExternalLink[] | null | undefined,
): WebtoonParams | null {
  if (!externalLinks) return null;
  for (const link of externalLinks) {
    const params = parseWebtoonUrl(link.url);
    if (params) return params;
  }
  return null;
}

export async function fetchWebtoonEpisodes(
  titleId: string,
  type: WebtoonType,
): Promise<WebtoonEpisode[]> {
  const res = await fetch(
    `/api/webtoon?titleId=${encodeURIComponent(titleId)}&type=${encodeURIComponent(type)}`,
  );

  if (!res.ok) {
    throw new Error(`Webtoon fetch failed: ${res.status}`);
  }

  const json: WebtoonApiResponse = await res.json();
  return json.result?.episodeList ?? [];
}

export async function getWebtoonCache(
  titleId: string,
): Promise<WebtoonCache | undefined> {
  return db.webtoonCache.get(titleId);
}

export async function saveWebtoonCache(
  titleId: string,
  type: WebtoonType,
  episodes: WebtoonEpisode[],
): Promise<void> {
  await db.webtoonCache.put({ titleId, type, episodes, fetchedAt: Date.now() });
}

export async function clearWebtoonCache(titleId: string): Promise<void> {
  await db.webtoonCache.delete(titleId);
}
