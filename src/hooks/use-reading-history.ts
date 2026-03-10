"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

/** Returns a debounced save function that persists reading progress.
 *  Also returns `justCompleted` — true once when the chapter is first finished. */
export function useSaveReadingProgress(mangaId: string, chapterNum: number, mangaTitle: string, coverImage: string) {
  const { user } = useAuth();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const mutation = useMutation(trpc.history.saveProgress.mutationOptions());
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const mutateRef = useRef(mutation.mutate);
  useEffect(() => { mutateRef.current = mutation.mutate; });

  const [justCompleted, setJustCompleted] = useState(false);
  const completionFiredRef = useRef(false);

  const save = useCallback(
    (pageIndex: number, totalPages: number) => {
      if (!user) return;
      if (!mangaId || !chapterNum || totalPages === 0) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        mutateRef.current(
          { mangaId, chapterNum, pageIndex, totalPages, mangaTitle, coverImage },
          {
            onSuccess: (data) => {
              if (data.justCompleted && !completionFiredRef.current) {
                completionFiredRef.current = true;
                setJustCompleted(true);
                // Invalidate completed chapters cache
                queryClient.invalidateQueries({ queryKey: trpc.history.getCompletedChapters.queryKey() });
                queryClient.invalidateQueries({ queryKey: trpc.history.getContinueReading.queryKey() });
              }
            },
          },
        );
      }, 1000); // debounce: 1 second
    },
    [user, mangaId, chapterNum, mangaTitle, coverImage, queryClient, trpc],
  );

  const dismissCompletion = useCallback(() => setJustCompleted(false), []);

  return { save, justCompleted, dismissCompletion };
}

/** Fetches the saved reading progress for a chapter */
export function useReadingProgress(mangaId: string, chapterNum: number) {
  const { user } = useAuth();
  const trpc = useTRPC();
  const result = useQuery({
    ...trpc.history.getProgress.queryOptions({ mangaId, chapterNum }),
    enabled: !!user && !!mangaId && chapterNum > 0,
    staleTime: 30_000,
  });
  return result.data ?? null;
}

/** Fetches all completed chapter numbers for a manga */
export function useCompletedChapters(mangaId: string) {
  const { user } = useAuth();
  const trpc = useTRPC();
  const result = useQuery({
    ...trpc.history.getCompletedChapters.queryOptions({ mangaId }),
    enabled: !!user && !!mangaId,
    staleTime: 30_000,
  });
  return {
    completedChapters: new Set((result.data ?? []).map((c) => c.chapterNum)),
    isLoading: result.isLoading,
  };
}

/** Fetches the continue-reading list for the home page */
export function useContinueReading(limit = 10) {
  const { user } = useAuth();
  const trpc = useTRPC();
  const result = useQuery({
    ...trpc.history.getContinueReading.queryOptions({ limit }),
    enabled: !!user,
    staleTime: 30_000,
  });
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
