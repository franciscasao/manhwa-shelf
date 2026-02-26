import type { AniListExternalLink } from "@/lib/anilist";
import { pb } from "@/lib/db";

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

  let fallback: WebtoonParams | null = null;
  for (const link of externalLinks) {
    const params = parseWebtoonUrl(link.url);
    if (!params) continue;
    if (link.language === null || link.language === "English") return params;
    fallback ??= params;
  }
  return fallback;
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
  try {
    const record = await pb
      .collection("webtoonCache")
      .getFirstListItem(`titleId = "${titleId}"`);
    return {
      titleId: record["titleId"] as string,
      type: record["type"] as WebtoonType,
      episodes: record["episodes"] as WebtoonEpisode[],
      fetchedAt: record["fetchedAt"] as number,
    };
  } catch {
    return undefined;
  }
}

export async function saveWebtoonCache(
  titleId: string,
  type: WebtoonType,
  episodes: WebtoonEpisode[],
): Promise<void> {
  let existingId: string | undefined;
  try {
    const existing = await pb
      .collection("webtoonCache")
      .getFirstListItem(`titleId = "${titleId}"`);
    existingId = existing.id;
  } catch {
    // Record doesn't exist yet — will create below
  }

  if (existingId) {
    await pb.collection("webtoonCache").update(existingId, {
      type,
      episodes,
      fetchedAt: Date.now(),
    });
  } else {
    await pb
      .collection("webtoonCache")
      .create({ titleId, type, episodes, fetchedAt: Date.now() });
  }
}

export async function clearWebtoonCache(titleId: string): Promise<void> {
  try {
    const existing = await pb
      .collection("webtoonCache")
      .getFirstListItem(`titleId = "${titleId}"`);
    await pb.collection("webtoonCache").delete(existing.id);
  } catch {
    // Cache entry doesn't exist, nothing to clear
  }
}
