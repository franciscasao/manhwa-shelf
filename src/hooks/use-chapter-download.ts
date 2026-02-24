"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { pb } from "@/lib/db";
import { downloadChapterToServer } from "@/lib/chapter-download";
import type {
  ChapterDownloadState,
  ChapterProgress,
  DownloadQueueItem,
} from "@/lib/types";

export function useChapterDownload(mangaId: string, mangaTitle: string) {
  const [queue, setQueue] = useState<DownloadQueueItem[]>([]);
  const [currentProgress, setCurrentProgress] = useState<ChapterProgress | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const processingRef = useRef(false);
  const [downloadRecords, setDownloadRecords] = useState<
    { chapterNum: number }[] | undefined
  >(undefined);

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
      if (
        (e.record["mangaId"] as string) !== mangaId
      )
        return;

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

  const processQueue = useCallback(
    async (items: DownloadQueueItem[]) => {
      if (processingRef.current) return;
      processingRef.current = true;

      const controller = new AbortController();
      abortControllerRef.current = controller;

      for (let i = 0; i < items.length; i++) {
        if (controller.signal.aborted) break;

        const item = items[i];
        const progress: ChapterProgress = {
          chapterNum: item.chapterNum,
          state: "fetching-pages" as ChapterDownloadState,
          imagesDownloaded: 0,
          imagesTotal: 0,
        };

        setCurrentProgress({ ...progress });

        try {
          await downloadChapterToServer(
            mangaId,
            mangaTitle,
            item.chapterNum,
            item.viewerLink,
            item.episodeTitle,
            (downloaded, total) => {
              if (controller.signal.aborted) return;
              setCurrentProgress({
                chapterNum: item.chapterNum,
                state: "downloading",
                imagesDownloaded: downloaded,
                imagesTotal: total,
              });
            },
            () => {
              if (controller.signal.aborted) return;
              setCurrentProgress({
                chapterNum: item.chapterNum,
                state: "uploading",
                imagesDownloaded: 0,
                imagesTotal: 0,
              });
            },
            controller.signal,
          );

          if (!controller.signal.aborted) {
            setCurrentProgress({
              chapterNum: item.chapterNum,
              state: "complete",
              imagesDownloaded: 0,
              imagesTotal: 0,
            });

            setQueue((prev) => prev.slice(1));
          }
        } catch (err) {
          if (!controller.signal.aborted) {
            setCurrentProgress({
              chapterNum: item.chapterNum,
              state: "error",
              imagesDownloaded: 0,
              imagesTotal: 0,
              error: err instanceof Error ? err.message : "Download failed",
            });
            setQueue((prev) => prev.slice(1));
          }
        }
      }

      processingRef.current = false;
      abortControllerRef.current = null;
      if (!controller.signal.aborted) {
        setCurrentProgress(null);
      }
    },
    [mangaId, mangaTitle],
  );

  const enqueueChapter = useCallback(
    (item: DownloadQueueItem) => {
      const newQueue = [item];
      setQueue(newQueue);
      processQueue(newQueue);
    },
    [processQueue],
  );

  const enqueueMany = useCallback(
    (items: DownloadQueueItem[]) => {
      // Filter out already-downloaded chapters
      const filtered = items.filter((item) => !downloadedChapters.has(item.chapterNum));
      if (filtered.length === 0) return;
      setQueue(filtered);
      processQueue(filtered);
    },
    [processQueue, downloadedChapters],
  );

  const cancelQueue = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    processingRef.current = false;
    setQueue([]);
    setCurrentProgress(null);
  }, []);

  const isDownloading = processingRef.current && !abortControllerRef.current?.signal.aborted;

  return {
    queue,
    currentProgress,
    downloadedChapters,
    enqueueChapter,
    enqueueMany,
    cancelQueue,
    isDownloading,
  };
}
