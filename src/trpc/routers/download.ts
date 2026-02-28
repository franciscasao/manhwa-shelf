import { z } from "zod";
import { createTRPCRouter, baseProcedure } from "@/trpc/init";
import { downloadManager } from "@/lib/download-manager";
import { eventChannel } from "@/lib/event-channel";
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
      yield downloadManager.getAllActive();
      yield* eventChannel<MangaProgressSnapshot[]>({
        emitter: downloadManager,
        events: ["progress:*"],
        signal,
      });
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
