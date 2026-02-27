"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useTRPC } from "@/trpc/client";

export interface ChapterReaderData {
  imageUrls: string[];
  episodeTitle: string;
  chapterNum: number;
  prevChapter: number | null;
  nextChapter: number | null;
}

function buildImageUrls(data: {
  recordId: string;
  collectionId: string;
  images: string[];
}): string[] {
  const baseUrl =
    process.env.NEXT_PUBLIC_POCKETBASE_URL ?? "http://127.0.0.1:8090";
  return data.images.map(
    (filename) =>
      `${baseUrl}/api/files/${data.collectionId}/${data.recordId}/${filename}`,
  );
}

export function useChapterReader(mangaId: string, chapterNum: number) {
  const trpc = useTRPC();

  const result = useQuery({
    ...trpc.chapter.getReader.queryOptions({ mangaId, chapterNum }),
    enabled: !!mangaId && chapterNum > 0,
    staleTime: Infinity,
    select: (data): ChapterReaderData => ({
      imageUrls: buildImageUrls(data),
      episodeTitle: data.episodeTitle,
      chapterNum: data.chapterNum,
      prevChapter: data.prevChapter,
      nextChapter: data.nextChapter,
    }),
  });

  return {
    chapter: result.data ?? null,
    isLoading: result.isLoading && result.fetchStatus !== "idle",
    error: result.error?.message ?? null,
  };
}

/** Prefetch a chapter into React Query cache so navigation is instant */
export function usePrefetchChapter(mangaId: string, chapterNum: number | null) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const prefetch = useCallback(() => {
    if (!mangaId || !chapterNum || chapterNum <= 0) return;
    queryClient.prefetchQuery(
      trpc.chapter.getReader.queryOptions({ mangaId, chapterNum }),
    );
  }, [queryClient, trpc, mangaId, chapterNum]);

  return prefetch;
}
