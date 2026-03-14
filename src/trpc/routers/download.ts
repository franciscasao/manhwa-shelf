import { z } from "zod";
import { createTRPCRouter, baseProcedure } from "@/trpc/init";
import { downloadManager } from "@/lib/download-manager";
import { eventChannel } from "@/lib/event-channel";
import { getServerPB } from "@/lib/db-server";
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

  dismissError: baseProcedure
    .input(z.object({ mangaId: z.string().min(1) }))
    .mutation(({ input }) => {
      downloadManager.dismissError(input.mangaId);
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
      yield downloadManager.getAllActive();
      yield* eventChannel<MangaProgressSnapshot[]>({
        emitter: downloadManager,
        events: ["progress:*"],
        signal,
      });
    }),

  remove: baseProcedure
    .input(
      z.object({
        mangaId: z.string().min(1),
        chapterNum: z.number().int().positive(),
      }),
    )
    .mutation(async ({ input }) => {
      const { mangaId, chapterNum } = input;
      const pb = await getServerPB();

      // Find and delete the chapter download record
      const records = await pb
        .collection("chapterDownloads")
        .getList(1, 1, {
          filter: `mangaId = "${mangaId}" && chapterNum = ${chapterNum}`,
        });

      if (records.totalItems === 0) {
        throw new Error(`Chapter ${chapterNum} not found in downloads`);
      }

      await pb.collection("chapterDownloads").delete(records.items[0].id);

      // Recalculate shelf stats
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
    }),

  progress: baseProcedure
    .input(z.object({ mangaId: z.string().min(1) }))
    .subscription(async function* ({ input, signal }) {
      const { mangaId } = input;

      const current = downloadManager.getStatus(mangaId);
      if (current) {
        yield current;
      }

      yield* eventChannel<MangaProgressSnapshot>({
        emitter: downloadManager,
        events: [`progress:${mangaId}`],
        doneEvents: [`done:${mangaId}`],
        signal,
      });
    }),
});
