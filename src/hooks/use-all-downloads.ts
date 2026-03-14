"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useTRPCClient } from "@/trpc/client";
import type { MangaProgressSnapshot } from "@/lib/types";

export function useAllDownloads() {
  const trpcClient = useTRPCClient();

  const [snapshots, setSnapshots] = useState<MangaProgressSnapshot[]>([]);

  // Fetch initial state
  useEffect(() => {
    trpcClient.download.allStatus.query().then(setSnapshots);
  }, [trpcClient]);

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

  const dismissError = useCallback(
    (mangaId: string) => {
      trpcClient.download.dismissError.mutate({ mangaId });
      setSnapshots((prev) => prev.filter((s) => s.mangaId !== mangaId));
    },
    [trpcClient],
  );

  const visibleSnapshots = useMemo(
    () => snapshots.filter((s) => s.isProcessing || s.currentChapter?.state === "error"),
    [snapshots],
  );

  const activeCount = visibleSnapshots.length;

  const totalQueued = useMemo(
    () =>
      visibleSnapshots.reduce(
        (sum, s) => sum + s.queuedChapters.length + (s.currentChapter ? 1 : 0),
        0,
      ),
    [visibleSnapshots],
  );

  return {
    snapshots: visibleSnapshots,
    activeCount,
    totalQueued,
    cancelManga,
    dismissError,
    isActive: activeCount > 0,
  };
}
