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

      const isCompleted = pageIndex >= totalPages - 1;

      // Try to find existing record for this user+manga+chapter
      let existingRecord: { id: string; completed?: boolean; completedAt?: string } | null = null;
      try {
        const existing = await pb
          .collection("readingHistory")
          .getFirstListItem(`userId="${userId}" && mangaId="${mangaId}" && chapterNum=${chapterNum}`);
        existingRecord = {
          id: existing.id,
          completed: existing.completed as boolean | undefined,
          completedAt: existing.completedAt as string | undefined,
        };
      } catch (err) {
        if (!(err instanceof ClientResponseError) || err.status !== 404) {
          throw err;
        }
      }

      // Only set completedAt on first completion (don't overwrite on re-reads)
      const wasAlreadyCompleted = existingRecord?.completed === true;
      const completedAt =
        isCompleted && !wasAlreadyCompleted
          ? new Date().toISOString()
          : existingRecord?.completedAt ?? "";

      const data = {
        userId,
        mangaId,
        chapterNum,
        pageIndex,
        totalPages,
        mangaTitle,
        coverImage,
        completed: isCompleted || wasAlreadyCompleted,
        completedAt,
      };

      if (existingRecord) {
        await pb.collection("readingHistory").update(existingRecord.id, data);
      } else {
        await pb.collection("readingHistory").create(data);
      }

      return { ok: true, completed: data.completed, justCompleted: isCompleted && !wasAlreadyCompleted };
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
          completed: (record.completed as boolean) ?? false,
        };
      } catch (err) {
        if (err instanceof ClientResponseError && err.status === 404) {
          return null;
        }
        throw err;
      }
    }),

  /** Get all completed chapter numbers for a manga */
  getCompletedChapters: authedProcedure
    .input(z.object({ mangaId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { pb, userId } = ctx;
      try {
        const records = await pb.collection("readingHistory").getFullList({
          filter: `userId="${userId}" && mangaId="${input.mangaId}" && completed=true`,
          fields: "chapterNum,completedAt",
          sort: "chapterNum",
        });
        return records.map((r) => ({
          chapterNum: r.chapterNum as number,
          completedAt: r.completedAt as string,
        }));
      } catch (err) {
        console.error("[history.getCompletedChapters] PocketBase error:", err);
        return [];
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
          filter: `userId="${userId}" && completed=false`,
          fields: "mangaId,chapterNum,pageIndex,totalPages,mangaTitle,coverImage,completed,updated",
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
        completed: (r.completed as boolean) ?? false,
        updatedAt: r.updated as string,
      }));
    }),

  /** Get next unread chapter per manga for the "Next Up" section */
  getNextUp: authedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(20).default(10) }))
    .query(async ({ ctx, input }) => {
      const { pb, userId } = ctx;
      let records;
      try {
        // Fetch all completed reading history for this user, sorted by most recent
        records = await pb.collection("readingHistory").getFullList({
          sort: "-updated",
          filter: `userId="${userId}" && completed=true`,
          fields: "mangaId,chapterNum,mangaTitle,coverImage,updated",
        });
      } catch (err) {
        console.error("[history.getNextUp] PocketBase error:", err);
        return [];
      }

      // Also fetch ongoing (incomplete) chapters to exclude those manga
      let ongoingRecords: { mangaId: unknown }[];
      try {
        ongoingRecords = await pb.collection("readingHistory").getFullList({
          filter: `userId="${userId}" && completed=false`,
          fields: "mangaId",
        });
      } catch {
        ongoingRecords = [];
      }
      const ongoingMangaIds = new Set(ongoingRecords.map((r) => r.mangaId as string));

      // Group by mangaId and find the highest completed chapter per manga
      const mangaMap = new Map<
        string,
        { maxChapter: number; mangaTitle: string; coverImage: string; updatedAt: string }
      >();
      for (const r of records) {
        const mid = r.mangaId as string;
        // Skip manga that have an ongoing chapter
        if (ongoingMangaIds.has(mid)) continue;
        const chNum = r.chapterNum as number;
        const existing = mangaMap.get(mid);
        if (!existing || chNum > existing.maxChapter) {
          mangaMap.set(mid, {
            maxChapter: chNum,
            mangaTitle: r.mangaTitle as string,
            coverImage: r.coverImage as string,
            updatedAt: existing?.updatedAt ?? (r.updated as string),
          });
        } else if (!existing.updatedAt) {
          existing.updatedAt = r.updated as string;
        }
      }

      // Build next-up list: next chapter = maxCompleted + 1
      const items = Array.from(mangaMap.entries())
        .map(([mangaId, info]) => ({
          mangaId,
          nextChapterNum: info.maxChapter + 1,
          lastCompletedChapter: info.maxChapter,
          mangaTitle: info.mangaTitle,
          coverImage: info.coverImage,
          updatedAt: info.updatedAt,
        }))
        .slice(0, input.limit);

      return items;
    }),
});
