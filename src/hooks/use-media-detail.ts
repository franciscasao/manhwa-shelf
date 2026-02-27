"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export function useMediaDetail(id: number) {
  const trpc = useTRPC();

  const result = useQuery({
    ...trpc.anilist.fetchById.queryOptions({ id }),
    enabled: !isNaN(id) && id > 0,
  });

  return {
    media: result.data ?? null,
    isLoading: result.isLoading && result.fetchStatus !== "idle",
    error: result.error?.message ?? null,
  };
}
