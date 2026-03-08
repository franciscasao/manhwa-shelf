"use client";

import { useCallback, useRef } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/** Returns a debounced save function that persists reading progress */
export function useSaveReadingProgress(mangaId: string, chapterNum: number, mangaTitle: string, coverImage: string) {
  const trpc = useTRPC();
  const mutation = useMutation(trpc.history.saveProgress.mutationOptions());
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const mutateRef = useRef(mutation.mutate);
  mutateRef.current = mutation.mutate;

  const save = useCallback(
    (pageIndex: number, totalPages: number) => {
      if (!mangaId || !chapterNum || totalPages === 0) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        mutateRef.current({ mangaId, chapterNum, pageIndex, totalPages, mangaTitle, coverImage });
      }, 1000); // debounce: 1 second
    },
    [mangaId, chapterNum, mangaTitle, coverImage],
  );

  return save;
}

/** Fetches the saved reading progress for a chapter */
export function useReadingProgress(mangaId: string, chapterNum: number) {
  const trpc = useTRPC();
  const result = useQuery({
    ...trpc.history.getProgress.queryOptions({ mangaId, chapterNum }),
    enabled: !!mangaId && chapterNum > 0,
    staleTime: 30_000,
  });
  return result.data ?? null;
}

/** Fetches the continue-reading list for the home page */
export function useContinueReading(limit = 10) {
  const trpc = useTRPC();
  const result = useQuery({
    ...trpc.history.getContinueReading.queryOptions({ limit }),
    staleTime: 30_000,
  });
  console.log("result: ", result);
  return {
    items: result.data ?? [],
    isLoading: result.isLoading,
  };
}

/** Invalidate continue-reading cache when progress is saved */
export function useInvalidateContinueReading() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: trpc.history.getContinueReading.queryKey() });
  }, [queryClient, trpc]);
}
