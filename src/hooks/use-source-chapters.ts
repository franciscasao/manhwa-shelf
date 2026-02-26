"use client";

import { useQuery } from "@tanstack/react-query";
import type { SourceIdentifier, SourceChapter } from "@/extensions";

export function useSourceChapters(source: SourceIdentifier | null) {
  const result = useQuery<SourceChapter[]>({
    queryKey: ["sourceChapters", source?.sourceId, source?.seriesId],
    queryFn: async () => {
      const res = await fetch(
        `/api/source/chapters?sourceId=${encodeURIComponent(source!.sourceId)}&seriesId=${encodeURIComponent(source!.seriesId)}`,
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Failed to fetch chapters: ${res.status}`);
      }

      const data = await res.json();
      return data.chapters as SourceChapter[];
    },
    enabled: source !== null,
    staleTime: Infinity,
  });

  return {
    chapters: result.data ?? null,
    isLoading: result.isLoading && result.fetchStatus !== "idle",
    error: result.error?.message ?? null,
  };
}
