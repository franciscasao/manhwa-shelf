"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchWebtoonEpisodes,
  getWebtoonCache,
  saveWebtoonCache,
  clearWebtoonCache,
  type WebtoonEpisode,
  type WebtoonParams,
} from "@/lib/webtoon";

export function useWebtoonEpisodes(params: WebtoonParams | null) {
  const queryClient = useQueryClient();

  const queryKey = ["webtoonEpisodes", params?.titleId, params?.type];

  const result = useQuery<WebtoonEpisode[]>({
    queryKey,
    queryFn: async () => {
      const { titleId, type } = params!;

      // Check Dexie cache first
      const cached = await getWebtoonCache(titleId);
      if (cached) return cached.episodes;

      // Fetch from API
      const episodes = await fetchWebtoonEpisodes(titleId, type);

      // Save to Dexie
      await saveWebtoonCache(titleId, type, episodes);

      return episodes;
    },
    enabled: params !== null,
    staleTime: Infinity,
  });

  const refetch = useCallback(async () => {
    if (!params) return;
    await clearWebtoonCache(params.titleId);
    await queryClient.invalidateQueries({ queryKey });
  }, [params, queryClient, queryKey]);

  return {
    episodes: result.data ?? null,
    isLoading: result.isLoading && result.fetchStatus !== "idle",
    error: result.error?.message ?? null,
    refetch,
  };
}
