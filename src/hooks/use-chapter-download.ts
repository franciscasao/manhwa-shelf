"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { pb } from "@/lib/db";
import { useTRPC, useTRPCClient } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import type {
  ChapterProgress,
  DownloadQueueItem,
  MangaProgressSnapshot,
} from "@/lib/types";

function snapshotToProgress(snapshot: MangaProgressSnapshot | null): {
  queue: DownloadQueueItem[];
  currentProgress: ChapterProgress | null;
  isProcessing: boolean;
} {
  if (!snapshot || !snapshot.isProcessing) {
    return { queue: [], currentProgress: null, isProcessing: false };
  }

  const queue: DownloadQueueItem[] = snapshot.queuedChapters.map((num) => ({
    mangaId: snapshot.mangaId,
    chapterNum: num,
    episodeTitle: "",
    chapterUrl: "",
    sourceId: "",
  }));

  const currentProgress: ChapterProgress | null = snapshot.currentChapter
    ? {
        chapterNum: snapshot.currentChapter.chapterNum,
        state: snapshot.currentChapter.state === "queued" ? "idle" : snapshot.currentChapter.state,
        imagesDownloaded: snapshot.currentChapter.imagesDownloaded,
        imagesTotal: snapshot.currentChapter.imagesTotal,
        error: snapshot.currentChapter.error,
      }
    : null;

  return { queue, currentProgress, isProcessing: snapshot.isProcessing };
}

export function useChapterDownload(mangaId: string, mangaTitle: string) {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();

  const [serverState, setServerState] = useState<MangaProgressSnapshot | null>(null);
  const [downloadRecords, setDownloadRecords] = useState<
    { chapterNum: number }[] | undefined
  >(undefined);

  // Fetch initial server state
  const statusQuery = useQuery(trpc.download.status.queryOptions({ mangaId }));

  // Sync initial status query into local state
  const initializedRef = useRef(false);
  useEffect(() => {
    if (statusQuery.data !== undefined && !initializedRef.current) {
      initializedRef.current = true;
      setServerState(statusQuery.data);
    }
  }, [statusQuery.data]);

  // Subscribe to live progress updates
  useEffect(() => {
    const sub = trpcClient.download.progress.subscribe(
      { mangaId },
      {
        onData(snapshot: MangaProgressSnapshot) {
          setServerState(snapshot);
        },
      },
    );

    return () => {
      sub.unsubscribe();
    };
  }, [trpcClient, mangaId]);

  // PocketBase subscription for tracking downloadedChapters set
  useEffect(() => {
    let cancelled = false;

    pb.collection("chapterDownloads")
      .getFullList({ filter: `mangaId = "${mangaId}"` })
      .then((records) => {
        if (!cancelled) {
          setDownloadRecords(
            records.map((r) => ({ chapterNum: r["chapterNum"] as number })),
          );
        }
      })
      .catch(() => {
        if (!cancelled) setDownloadRecords([]);
      });

    pb.collection("chapterDownloads").subscribe("*", (e) => {
      if ((e.record["mangaId"] as string) !== mangaId) return;

      setDownloadRecords((prev) => {
        const current = prev ?? [];
        if (e.action === "create") {
          return [...current, { chapterNum: e.record["chapterNum"] as number }];
        }
        if (e.action === "delete") {
          return current.filter(
            (r) => r.chapterNum !== (e.record["chapterNum"] as number),
          );
        }
        return current;
      });
    });

    return () => {
      cancelled = true;
      pb.collection("chapterDownloads").unsubscribe("*");
    };
  }, [mangaId]);

  const downloadedChapters = useMemo(() => {
    const set = new Set<number>();
    if (downloadRecords) {
      for (const record of downloadRecords) {
        set.add(record.chapterNum);
      }
    }
    return set;
  }, [downloadRecords]);

  const enqueueChapter = useCallback(
    (item: DownloadQueueItem) => {
      trpcClient.download.enqueue.mutate({
        mangaId,
        mangaTitle,
        items: [
          {
            chapterNum: item.chapterNum,
            chapterUrl: item.chapterUrl,
            episodeTitle: item.episodeTitle,
            sourceId: item.sourceId,
          },
        ],
      });
    },
    [trpcClient, mangaId, mangaTitle],
  );

  const enqueueMany = useCallback(
    (items: DownloadQueueItem[]) => {
      const filtered = items.filter((item) => !downloadedChapters.has(item.chapterNum));
      if (filtered.length === 0) return;

      trpcClient.download.enqueue.mutate({
        mangaId,
        mangaTitle,
        items: filtered.map((item) => ({
          chapterNum: item.chapterNum,
          chapterUrl: item.chapterUrl,
          episodeTitle: item.episodeTitle,
          sourceId: item.sourceId,
        })),
      });
    },
    [trpcClient, mangaId, mangaTitle, downloadedChapters],
  );

  const cancelQueue = useCallback(() => {
    trpcClient.download.cancel.mutate({ mangaId });
    setServerState(null);
  }, [trpcClient, mangaId]);

  const { queue, currentProgress, isProcessing } = snapshotToProgress(serverState);

  return {
    queue,
    currentProgress,
    downloadedChapters,
    enqueueChapter,
    enqueueMany,
    cancelQueue,
    isDownloading: isProcessing,
  };
}
