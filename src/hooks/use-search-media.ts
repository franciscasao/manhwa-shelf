"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import type { SearchOrigin } from "@/lib/types";

export function useSearchMedia(
  query: string,
  origin: SearchOrigin,
  page: number,
  isAdult: boolean = false,
) {
  const trpc = useTRPC();
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const loadStartRef = useRef<number | null>(null);
  const [queryMs, setQueryMs] = useState<number | null>(null);

  // Debounce query changes by 500ms, but skip debounce for page-only changes
  useEffect(() => {
    if (query === debouncedQuery) return;
    const timer = setTimeout(() => setDebouncedQuery(query), 500);
    return () => clearTimeout(timer);
  }, [query, debouncedQuery]);

  const trimmed = debouncedQuery.trim();
  const enabled = trimmed.length >= 2;

  const opts = trpc.anilist.search.queryOptions({
    query: trimmed,
    origin,
    page,
    isAdult,
  });

  const result = useQuery({
    ...opts,
    queryFn: async (context) => {
      loadStartRef.current = Date.now();
      setQueryMs(null);
      const data = await opts.queryFn!(context);
      setQueryMs(Date.now() - (loadStartRef.current ?? Date.now()));
      loadStartRef.current = null;
      return data;
    },
    enabled,
  });

  const hasSearched = enabled && result.isFetched;

  return {
    results: result.data?.media ?? [],
    pageInfo: result.data?.pageInfo ?? null,
    isLoading: result.isLoading && result.fetchStatus !== "idle",
    isFetching: result.isFetching,
    error: result.error?.message ?? null,
    hasSearched,
    queryMs,
  };
}
