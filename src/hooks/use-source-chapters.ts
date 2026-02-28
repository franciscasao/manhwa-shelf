"use client";

import { useState, useEffect, useCallback } from "react";
import { useTRPCClient } from "@/trpc/client";
import type { SourceIdentifier } from "@/extensions";
import type { SourceChapter } from "@/extensions/types";

export function useSourceChapters(source: SourceIdentifier | null) {
  const trpcClient = useTRPCClient();

  const [chapters, setChapters] = useState<SourceChapter[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initial fetch
  useEffect(() => {
    if (!source) return;

    let cancelled = false;

    setIsLoading(true);
    setError(null);

    trpcClient.source.fetchChapters
      .query({ sourceId: source.sourceId, seriesId: source.seriesId })
      .then((data) => {
        if (!cancelled) {
          setChapters(data);
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
  }, [trpcClient, source?.sourceId, source?.seriesId]);

  const refresh = useCallback(() => {
    if (!source) return;

    setIsRefreshing(true);

    trpcClient.source.refreshChapters
      .mutate({ sourceId: source.sourceId, seriesId: source.seriesId })
      .then((data) => {
        setChapters(data);
      })
      .catch((err: Error) => {
        setError(err.message);
      })
      .finally(() => {
        setIsRefreshing(false);
      });
  }, [trpcClient, source]);

  return {
    chapters,
    isLoading,
    error,
    refresh,
    isRefreshing,
  };
}
