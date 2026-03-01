"use client";

import { useState, useEffect } from "react";
import { useTRPCClient } from "@/trpc/client";
import type { AniListMediaDetail } from "@/lib/anilist";

export function useMediaDetail(id: number) {
  const trpcClient = useTRPCClient();

  const [media, setMedia] = useState<AniListMediaDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNaN(id) || id <= 0) return;

    setIsLoading(true);
    setError(null);

    let cancelled = false;

    trpcClient.anilist.fetchById
      .query({ id })
      .then((data) => {
        if (!cancelled) {
          setMedia(data);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [trpcClient, id]);

  return { media, isLoading, error };
}
