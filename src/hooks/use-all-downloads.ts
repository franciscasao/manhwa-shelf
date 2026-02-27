"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useTRPC, useTRPCClient } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import type { MangaProgressSnapshot } from "@/lib/types";

export function useAllDownloads() {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();

  const [snapshots, setSnapshots] = useState<MangaProgressSnapshot[]>([]);

  // Fetch initial state
  const statusQuery = useQuery(trpc.download.allStatus.queryOptions());

  const initializedRef = useRef(false);
  useEffect(() => {
    if (statusQuery.data !== undefined && !initializedRef.current) {
      initializedRef.current = true;
      setSnapshots(statusQuery.data);
    }
  }, [statusQuery.data]);

  // Subscribe to live updates
  useEffect(() => {
    const sub = trpcClient.download.allProgress.subscribe(undefined, {
      onData(data: MangaProgressSnapshot[]) {
        setSnapshots(data);
      },
    });

    return () => {
      sub.unsubscribe();
    };
  }, [trpcClient]);

  const cancelManga = useCallback(
    (mangaId: string) => {
      trpcClient.download.cancel.mutate({ mangaId });
      setSnapshots((prev) => prev.filter((s) => s.mangaId !== mangaId));
    },
    [trpcClient],
  );

  const activeSnapshots = useMemo(
    () => snapshots.filter((s) => s.isProcessing),
    [snapshots],
  );

  const activeCount = activeSnapshots.length;

  const totalQueued = useMemo(
    () =>
      activeSnapshots.reduce(
        (sum, s) => sum + s.queuedChapters.length + (s.currentChapter ? 1 : 0),
        0,
      ),
    [activeSnapshots],
  );

  return {
    snapshots: activeSnapshots,
    activeCount,
    totalQueued,
    cancelManga,
    isActive: activeCount > 0,
  };
}
