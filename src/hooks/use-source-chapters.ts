"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import type { SourceIdentifier } from "@/extensions";

export function useSourceChapters(source: SourceIdentifier | null) {
  const trpc = useTRPC();

  const result = useQuery({
    ...trpc.source.fetchChapters.queryOptions({
      sourceId: source?.sourceId ?? "",
      seriesId: source?.seriesId ?? "",
    }),
    enabled: source !== null,
    staleTime: Infinity,
  });

  return {
    chapters: result.data ?? null,
    isLoading: result.isLoading && result.fetchStatus !== "idle",
    error: result.error?.message ?? null,
  };
}
