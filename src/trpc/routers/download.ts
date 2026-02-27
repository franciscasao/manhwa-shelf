import { z } from "zod";
import { createTRPCRouter, baseProcedure } from "@/trpc/init";
import { downloadManager } from "@/lib/download-manager";
import type { MangaProgressSnapshot } from "@/lib/types";

const downloadItemSchema = z.object({
  chapterNum: z.number().int().positive(),
  chapterUrl: z.string().min(1),
  episodeTitle: z.string().optional().default(""),
  sourceId: z.string().min(1),
});

export const downloadRouter = createTRPCRouter({
  enqueue: baseProcedure
    .input(
      z.object({
        mangaId: z.string().min(1),
        mangaTitle: z.string(),
        items: z.array(downloadItemSchema).min(1),
      }),
    )
    .mutation(({ input }) => {
      return downloadManager.enqueue(input.mangaId, input.mangaTitle, input.items);
    }),

  cancel: baseProcedure
    .input(z.object({ mangaId: z.string().min(1) }))
    .mutation(({ input }) => {
      downloadManager.cancel(input.mangaId);
    }),

  status: baseProcedure
    .input(z.object({ mangaId: z.string().min(1) }))
    .query(({ input }) => {
      return downloadManager.getStatus(input.mangaId);
    }),

  allStatus: baseProcedure
    .query(() => {
      return downloadManager.getAllActive();
    }),

  allProgress: baseProcedure
    .subscription(async function* ({ signal }) {
      // Yield current state immediately
      yield downloadManager.getAllActive();

      const queue: MangaProgressSnapshot[][] = [];
      let resolve: (() => void) | null = null;
      let done = false;

      const onProgress = (snapshots: MangaProgressSnapshot[]) => {
        queue.push(snapshots);
        resolve?.();
      };

      downloadManager.on("progress:*", onProgress);

      const cleanup = () => {
        downloadManager.off("progress:*", onProgress);
      };

      signal?.addEventListener("abort", () => {
        done = true;
        resolve?.();
      }, { once: true });

      try {
        while (!done && !signal?.aborted) {
          if (queue.length > 0) {
            yield queue.shift()!;
          } else {
            await new Promise<void>((r) => {
              resolve = r;
            });
            resolve = null;
          }
        }
        while (queue.length > 0) {
          yield queue.shift()!;
        }
      } finally {
        cleanup();
      }
    }),

  progress: baseProcedure
    .input(z.object({ mangaId: z.string().min(1) }))
    .subscription(async function* ({ input, signal }) {
      const { mangaId } = input;

      // Yield current state immediately on connect
      const current = downloadManager.getStatus(mangaId);
      if (current) {
        yield current;
      }

      // Bridge EventEmitter → async generator using a push-queue
      const queue: MangaProgressSnapshot[] = [];
      let resolve: (() => void) | null = null;
      let done = false;

      const onProgress = (snapshot: MangaProgressSnapshot) => {
        queue.push(snapshot);
        resolve?.();
      };

      const onDone = () => {
        done = true;
        resolve?.();
      };

      downloadManager.on(`progress:${mangaId}`, onProgress);
      downloadManager.on(`done:${mangaId}`, onDone);

      const cleanup = () => {
        downloadManager.off(`progress:${mangaId}`, onProgress);
        downloadManager.off(`done:${mangaId}`, onDone);
      };

      signal?.addEventListener("abort", () => {
        done = true;
        resolve?.();
      }, { once: true });

      try {
        while (!done && !signal?.aborted) {
          if (queue.length > 0) {
            yield queue.shift()!;
          } else {
            await new Promise<void>((r) => {
              resolve = r;
            });
            resolve = null;
          }
        }
        // Drain remaining items
        while (queue.length > 0) {
          yield queue.shift()!;
        }
      } finally {
        cleanup();
      }
    }),
});
