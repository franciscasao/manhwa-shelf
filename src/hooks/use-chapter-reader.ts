"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

interface ChapterData {
  recordId: string;
  collectionId: string;
  images: string[];
  episodeTitle: string;
  chapterNum: number;
  prevChapter: number | null;
  nextChapter: number | null;
}

export interface ChapterReaderData {
  imageUrls: string[];
  episodeTitle: string;
  chapterNum: number;
  prevChapter: number | null;
  nextChapter: number | null;
}

async function fetchChapter(
  mangaId: string,
  chapterNum: number,
): Promise<ChapterReaderData> {
  const res = await fetch(`/api/chapter/${mangaId}/${chapterNum}`);
  if (!res.ok) {
    throw new Error(res.status === 404 ? "Chapter not found" : "Failed to load chapter");
  }

  const data: ChapterData = await res.json();
  const baseUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL ?? "http://127.0.0.1:8090";

  const imageUrls = data.images.map(
    (filename) =>
      `${baseUrl}/api/files/${data.collectionId}/${data.recordId}/${filename}`,
  );

  return {
    imageUrls,
    episodeTitle: data.episodeTitle,
    chapterNum: data.chapterNum,
    prevChapter: data.prevChapter,
    nextChapter: data.nextChapter,
  };
}

export function useChapterReader(mangaId: string, chapterNum: number) {
  const result = useQuery<ChapterReaderData>({
    queryKey: ["chapterReader", mangaId, chapterNum],
    queryFn: () => fetchChapter(mangaId, chapterNum),
    enabled: !!mangaId && chapterNum > 0,
    staleTime: Infinity,
  });

  return {
    chapter: result.data ?? null,
    isLoading: result.isLoading && result.fetchStatus !== "idle",
    error: result.error?.message ?? null,
  };
}

/** Prefetch a chapter into React Query cache so navigation is instant */
export function usePrefetchChapter(mangaId: string, chapterNum: number | null) {
  const queryClient = useQueryClient();

  const prefetch = useCallback(() => {
    if (!mangaId || !chapterNum || chapterNum <= 0) return;
    queryClient.prefetchQuery({
      queryKey: ["chapterReader", mangaId, chapterNum],
      queryFn: () => fetchChapter(mangaId, chapterNum),
      staleTime: Infinity,
    });
  }, [queryClient, mangaId, chapterNum]);

  return prefetch;
}
