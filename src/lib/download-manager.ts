import { EventEmitter } from "events";
import { getSource } from "@/extensions";
import { getServerPB } from "@/lib/db-server";
import { optimizeImage } from "@/lib/image-optimize";
import type { ManagedChapterState, MangaProgressSnapshot } from "@/lib/types";

interface DownloadJob {
  chapterNum: number;
  chapterUrl: string;
  episodeTitle: string;
  sourceId: string;
}

interface MangaDownloadQueue {
  mangaId: string;
  mangaTitle: string;
  jobs: DownloadJob[];
  currentJob: DownloadJob | null;
  currentState: ManagedChapterState | null;
  completedChapters: number[];
  abortController: AbortController;
}

class DownloadManager extends EventEmitter {
  private queues = new Map<string, MangaDownloadQueue>();

  enqueue(
    mangaId: string,
    mangaTitle: string,
    items: DownloadJob[],
  ): MangaProgressSnapshot {
    const existing = this.queues.get(mangaId);

    if (existing) {
      // Deduplicate: skip chapters already queued, in-progress, or completed this session
      const activeNums = new Set<number>([
        ...existing.jobs.map((j) => j.chapterNum),
        ...existing.completedChapters,
      ]);
      if (existing.currentJob) activeNums.add(existing.currentJob.chapterNum);

      const newJobs = items.filter((item) => !activeNums.has(item.chapterNum));
      existing.jobs.push(...newJobs);
      const snapshot = this.getSnapshot(mangaId)!;
      this.emit(`progress:${mangaId}`, snapshot);
      return snapshot;
    }

    // Create a new queue
    const queue: MangaDownloadQueue = {
      mangaId,
      mangaTitle,
      jobs: [...items],
      currentJob: null,
      currentState: null,
      completedChapters: [],
      abortController: new AbortController(),
    };
    this.queues.set(mangaId, queue);

    // Start processing (fire-and-forget)
    this.processQueue(mangaId);

    return this.getSnapshot(mangaId)!;
  }

  cancel(mangaId: string): void {
    const queue = this.queues.get(mangaId);
    if (!queue) return;

    const mangaTitle = queue.mangaTitle;
    queue.abortController.abort();
    this.queues.delete(mangaId);
    this.emit(`progress:${mangaId}`, {
      mangaId,
      mangaTitle,
      currentChapter: null,
      queuedChapters: [],
      completedChapters: queue.completedChapters,
      isProcessing: false,
    } satisfies MangaProgressSnapshot);
    this.emit(`done:${mangaId}`);
    this.emit("progress:*", this.getAllActive());
  }

  getStatus(mangaId: string): MangaProgressSnapshot | null {
    return this.getSnapshot(mangaId);
  }

  getAllActive(): MangaProgressSnapshot[] {
    const snapshots: MangaProgressSnapshot[] = [];
    for (const mangaId of this.queues.keys()) {
      const snapshot = this.getSnapshot(mangaId);
      if (snapshot) snapshots.push(snapshot);
    }
    return snapshots;
  }

  private getSnapshot(mangaId: string): MangaProgressSnapshot | null {
    const queue = this.queues.get(mangaId);
    if (!queue) return null;

    return {
      mangaId,
      mangaTitle: queue.mangaTitle,
      currentChapter: queue.currentState,
      queuedChapters: queue.jobs.map((j) => j.chapterNum),
      completedChapters: queue.completedChapters,
      isProcessing: true,
    };
  }

  private async processQueue(mangaId: string): Promise<void> {
    const queue = this.queues.get(mangaId);
    if (!queue) return;

    const pb = getServerPB();
    const signal = queue.abortController.signal;

    while (queue.jobs.length > 0) {
      if (signal.aborted) return;

      const job = queue.jobs.shift()!;
      queue.currentJob = job;
      queue.currentState = {
        chapterNum: job.chapterNum,
        state: "fetching-pages",
        imagesDownloaded: 0,
        imagesTotal: 0,
      };
      this.emitProgress(mangaId);

      try {
        const source = getSource(job.sourceId);
        if (!source) {
          queue.currentState = {
            chapterNum: job.chapterNum,
            state: "error",
            imagesDownloaded: 0,
            imagesTotal: 0,
            error: `Unknown source: ${job.sourceId}`,
          };
          this.emitProgress(mangaId);
          queue.completedChapters.push(job.chapterNum);
          continue;
        }

        // 1. Fetch page images
        const pages = await source.fetchChapterPages(job.chapterUrl);
        if (signal.aborted) return;

        if (pages.length === 0) {
          queue.currentState = {
            chapterNum: job.chapterNum,
            state: "error",
            imagesDownloaded: 0,
            imagesTotal: 0,
            error: "No images found in chapter",
          };
          this.emitProgress(mangaId);
          queue.completedChapters.push(job.chapterNum);
          continue;
        }

        const total = pages.length;
        queue.currentState = {
          chapterNum: job.chapterNum,
          state: "downloading",
          imagesDownloaded: 0,
          imagesTotal: total,
        };
        this.emitProgress(mangaId);

        // 2. Download images in batches of 3
        const imageData: { buffer: Uint8Array; contentType: string }[] = [];
        const batchSize = 3;
        let downloaded = 0;

        for (let i = 0; i < pages.length; i += batchSize) {
          if (signal.aborted) return;

          const batch = pages.slice(i, i + batchSize);
          const results = await Promise.all(
            batch.map(async (page) => {
              const headers = { ...source.imageHeaders, ...page.headers };
              const res = await fetch(page.url, { headers });
              if (!res.ok) {
                throw new Error(`Image fetch failed: ${res.status} for ${page.url}`);
              }
              const buffer = await res.arrayBuffer();
              const contentType = res.headers.get("content-type") ?? "image/jpeg";
              return { buffer, contentType };
            }),
          );

          for (const { buffer, contentType } of results) {
            const optimized = await optimizeImage(new Uint8Array(buffer), contentType);
            imageData.push(optimized);
            downloaded++;
            queue.currentState = {
              chapterNum: job.chapterNum,
              state: "downloading",
              imagesDownloaded: downloaded,
              imagesTotal: total,
            };
            this.emitProgress(mangaId);
          }
        }

        if (signal.aborted) return;

        // 3. Upload to PocketBase
        queue.currentState = {
          chapterNum: job.chapterNum,
          state: "uploading",
          imagesDownloaded: downloaded,
          imagesTotal: total,
        };
        this.emitProgress(mangaId);

        const sizeBytes = imageData.reduce((sum, img) => sum + img.buffer.byteLength, 0);

        const existing = await pb
          .collection("chapterDownloads")
          .getList(1, 1, {
            filter: `mangaId = "${mangaId}" && chapterNum = ${job.chapterNum}`,
          });

        const formData = new FormData();
        formData.append("mangaId", mangaId);
        formData.append("chapterNum", String(job.chapterNum));
        formData.append("episodeTitle", job.episodeTitle);
        formData.append("sizeBytes", String(sizeBytes));
        formData.append("downloadedAt", String(Date.now()));

        for (let i = 0; i < imageData.length; i++) {
          const { buffer, contentType } = imageData[i];
          const ext = contentType.includes("gif") ? "gif" : contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
          const fileName = `${String(i + 1).padStart(3, "0")}.${ext}`;
          formData.append("images", new Blob([buffer.buffer as ArrayBuffer], { type: contentType }), fileName);
        }

        if (existing.totalItems > 0) {
          await pb.collection("chapterDownloads").update(existing.items[0].id, formData);
        } else {
          await pb.collection("chapterDownloads").create(formData);
        }

        // 4. Update shelf downloaded count and size
        try {
          const allChapters = await pb
            .collection("chapterDownloads")
            .getFullList({
              filter: `mangaId = "${mangaId}"`,
              fields: "sizeBytes",
            });

          const totalChapters = allChapters.length;
          const totalBytes = allChapters.reduce(
            (sum, ch) => sum + (ch.sizeBytes || 0),
            0,
          );
          const formattedSize =
            totalBytes >= 1024 * 1024 * 1024
              ? `${(totalBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
              : `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`;

          const shelfRecord = await pb.collection("shelf").getOne(mangaId);
          const existingChapters = shelfRecord.chapters as {
            downloaded: number;
            total: number | null;
          };

          await pb.collection("shelf").update(mangaId, {
            chapters: {
              downloaded: totalChapters,
              total: existingChapters?.total ?? null,
            },
            sizeOnDisk: formattedSize,
          });
        } catch {
          // Shelf entry may not exist
        }

        if (signal.aborted) return;

        // Mark complete
        queue.currentState = {
          chapterNum: job.chapterNum,
          state: "complete",
          imagesDownloaded: downloaded,
          imagesTotal: total,
        };
        this.emitProgress(mangaId);
        queue.completedChapters.push(job.chapterNum);
      } catch (err) {
        if (signal.aborted) return;

        queue.currentState = {
          chapterNum: job.chapterNum,
          state: "error",
          imagesDownloaded: queue.currentState?.imagesDownloaded ?? 0,
          imagesTotal: queue.currentState?.imagesTotal ?? 0,
          error: err instanceof Error ? err.message : "Download failed",
        };
        this.emitProgress(mangaId);
        queue.completedChapters.push(job.chapterNum);
      }
    }

    // Queue fully processed
    queue.currentJob = null;
    queue.currentState = null;
    const mangaTitle = queue.mangaTitle;
    const finalSnapshot: MangaProgressSnapshot = {
      mangaId,
      mangaTitle,
      currentChapter: null,
      queuedChapters: [],
      completedChapters: queue.completedChapters,
      isProcessing: false,
    };
    this.queues.delete(mangaId);
    this.emit(`progress:${mangaId}`, finalSnapshot);
    this.emit(`done:${mangaId}`);
    this.emit("progress:*", this.getAllActive());
  }

  private emitProgress(mangaId: string): void {
    const snapshot = this.getSnapshot(mangaId);
    if (snapshot) {
      this.emit(`progress:${mangaId}`, snapshot);
      this.emit("progress:*", this.getAllActive());
    }
  }
}

export const downloadManager = new DownloadManager();
