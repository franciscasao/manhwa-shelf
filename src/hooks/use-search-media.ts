"use client";

import { useState, useEffect, useRef } from "react";
import { useTRPCClient } from "@/trpc/client";
import type { SearchOrigin } from "@/lib/types";
import type { AniListMedia, PageInfo } from "@/lib/anilist";

export function useSearchMedia(query: string, origin: SearchOrigin, page: number, isAdult: boolean = false) {
  const trpcClient = useTRPCClient();
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const loadStartRef = useRef<number | null>(null);
  const [queryMs, setQueryMs] = useState<number | null>(null);

  const [results, setResults] = useState<AniListMedia[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounce query changes by 500ms
  useEffect(() => {
    if (query === debouncedQuery) return;
    const timer = setTimeout(() => setDebouncedQuery(query), 500);
    return () => clearTimeout(timer);
  }, [query, debouncedQuery]);

  // Fetch when debounced query, origin, page, or isAdult changes
  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (trimmed.length < 2) return;

    let cancelled = false;

    setIsLoading(true);
    setIsFetching(true);
    setError(null);
    setQueryMs(null);
    loadStartRef.current = Date.now();

    trpcClient.anilist.search
      .query({ query: trimmed, origin, page, isAdult })
      .then((data) => {
        if (!cancelled) {
          setQueryMs(Date.now() - (loadStartRef.current ?? Date.now()));
          loadStartRef.current = null;
          setResults(data.media);
          setPageInfo(data.pageInfo);
          setHasSearched(true);
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
          setIsFetching(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [trpcClient, debouncedQuery, origin, page, isAdult]);

  return {
    results,
    pageInfo,
    isLoading,
    isFetching,
    error,
    hasSearched,
    queryMs,
  };
}
