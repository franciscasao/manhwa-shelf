"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchManhwaById, type AniListMediaDetail } from "@/lib/anilist";

export function useMediaDetail(id: number) {
  const result = useQuery<AniListMediaDetail>({
    queryKey: ["mediaDetail", id],
    queryFn: () => fetchManhwaById(id),
    enabled: !isNaN(id) && id > 0,
  });

  return {
    media: result.data ?? null,
    isLoading: result.isLoading && result.fetchStatus !== "idle",
    error: result.error?.message ?? null,
  };
}
