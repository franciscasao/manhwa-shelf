import { z } from "zod";
import { createTRPCRouter, authedProcedure } from "@/trpc/init";
import { ClientResponseError } from "pocketbase";

export const historyRouter = createTRPCRouter({
  /** Save or update reading progress for a chapter */
  saveProgress: authedProcedure
    .input(
      z.object({
        mangaId: z.string(),
        chapterNum: z.number(),
        pageIndex: z.number().int().min(0),
        totalPages: z.number().int().min(1),
        mangaTitle: z.string(),
        coverImage: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { pb, userId } = ctx;
      const { mangaId, chapterNum, pageIndex, totalPages, mangaTitle, coverImage } = input;

      // Try to find existing record for this user+manga+chapter
      let existingId: string | null = null;
      try {
        const existing = await pb
          .collection("readingHistory")
          .getFirstListItem(`userId="${userId}" && mangaId="${mangaId}" && chapterNum=${chapterNum}`);
        existingId = existing.id;
      } catch (err) {
        if (!(err instanceof ClientResponseError) || err.status !== 404) {
          throw err;
        }
      }

      const data = { userId, mangaId, chapterNum, pageIndex, totalPages, mangaTitle, coverImage };

      if (existingId) {
        await pb.collection("readingHistory").update(existingId, data);
      } else {
        await pb.collection("readingHistory").create(data);
      }

      return { ok: true };
    }),

  /** Get reading progress for a specific chapter */
  getProgress: authedProcedure
    .input(z.object({ mangaId: z.string(), chapterNum: z.number() }))
    .query(async ({ ctx, input }) => {
      const { pb, userId } = ctx;
      try {
        const record = await pb
          .collection("readingHistory")
          .getFirstListItem(`userId="${userId}" && mangaId="${input.mangaId}" && chapterNum=${input.chapterNum}`);
        return {
          pageIndex: record.pageIndex as number,
          totalPages: record.totalPages as number,
        };
      } catch (err) {
        if (err instanceof ClientResponseError && err.status === 404) {
          return null;
        }
        throw err;
      }
    }),

  /** Get recent reading history sorted by last updated (for Continue Reading section) */
  getContinueReading: authedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(20).default(10) }))
    .query(async ({ ctx, input }) => {
      const { pb, userId } = ctx;
      let records;
      try {
        records = await pb.collection("readingHistory").getList(1, input.limit, {
          sort: "-updated",
          filter: `userId="${userId}"`,
          fields: "mangaId,chapterNum,pageIndex,totalPages,mangaTitle,coverImage,updated",
        });
      } catch (err) {
        console.error("[history.getContinueReading] PocketBase error:", err);
        return [];
      }

      // Deduplicate by mangaId, keeping only the most recently updated per manga
      const seen = new Set<string>();
      const unique = records.items.filter((r) => {
        if (seen.has(r.mangaId as string)) return false;
        seen.add(r.mangaId as string);
        return true;
      });

      return unique.map((r) => ({
        mangaId: r.mangaId as string,
        chapterNum: r.chapterNum as number,
        pageIndex: r.pageIndex as number,
        totalPages: r.totalPages as number,
        mangaTitle: r.mangaTitle as string,
        coverImage: r.coverImage as string,
        updatedAt: r.updated as string,
      }));
    }),
});
