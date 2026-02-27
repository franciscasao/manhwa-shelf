"use client";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import type { SourceIdentifier } from "@/extensions";

export function useSourceChapters(source: SourceIdentifier | null) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const queryOptions = trpc.source.fetchChapters.queryOptions({
    sourceId: source?.sourceId ?? "",
    seriesId: source?.seriesId ?? "",
  });

  const result = useQuery({
    ...queryOptions,
    enabled: source !== null,
    staleTime: Infinity,
  });

  const refreshMutation = useMutation({
    ...trpc.source.refreshChapters.mutationOptions(),
    onSuccess: (data) => {
      // Inject fresh data into the fetchChapters query cache
      queryClient.setQueryData(queryOptions.queryKey, data);
    },
  });

  const refresh = () => {
    if (!source) return;
    refreshMutation.mutate({
      sourceId: source.sourceId,
      seriesId: source.seriesId,
    });
  };

  return {
    chapters: result.data ?? null,
    isLoading: result.isLoading && result.fetchStatus !== "idle",
    error: result.error?.message ?? null,
    refresh,
    isRefreshing: refreshMutation.isPending,
  };
}
