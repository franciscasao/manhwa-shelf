"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef } from "react";
import { useTRPC } from "@/trpc/client";

/** Number of images to preload from the next chapter so navigation feels instant */
const PREFETCH_IMAGE_COUNT = 4;

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
  return data.images.map(
    (filename) =>
      `/api/chapter/image?c=${data.collectionId}&r=${data.recordId}&f=${filename}`,
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

/**
 * Prefetch a chapter into React Query cache AND preload the first few image
 * bytes into the browser cache so navigation to the next chapter is instant.
 */
export function usePrefetchChapter(mangaId: string, chapterNum: number | null) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const prefetchedImagesRef = useRef<Set<string>>(new Set());

  const prefetch = useCallback(() => {
    if (!mangaId || !chapterNum || chapterNum <= 0) return;

    // 1. Prefetch tRPC data into React Query cache
    queryClient
      .prefetchQuery(
        trpc.chapter.getReader.queryOptions({ mangaId, chapterNum }),
      )
      .then(() => {
        // 2. Once data is cached, preload the first N images via <link rel="prefetch">
        const data = queryClient.getQueryData(
          trpc.chapter.getReader.queryOptions({ mangaId, chapterNum }).queryKey,
        );
        if (!data) return;

        const urls = buildImageUrls(data as { recordId: string; collectionId: string; images: string[] });
        const toPreload = urls.slice(0, PREFETCH_IMAGE_COUNT);

        for (const url of toPreload) {
          if (prefetchedImagesRef.current.has(url)) continue;
          prefetchedImagesRef.current.add(url);

          const link = document.createElement("link");
          link.rel = "prefetch";
          link.as = "image";
          link.href = url;
          document.head.appendChild(link);
        }
      });
  }, [queryClient, trpc, mangaId, chapterNum]);

  return prefetch;
}
