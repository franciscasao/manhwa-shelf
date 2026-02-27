import { z } from "zod";
import { createTRPCRouter, baseProcedure } from "@/trpc/init";
import { getSource, type SourceChapter } from "@/extensions";
import { TRPCError } from "@trpc/server";
import { createHash } from "crypto";
import type PocketBase from "pocketbase";

/** Deterministic 15-char PocketBase ID from sourceId + seriesId. */
function toChapterCacheId(sourceId: string, seriesId: string): string {
  return createHash("md5")
    .update(`${sourceId}:${seriesId}`)
    .digest("hex")
    .slice(0, 15);
}

/** Fetch chapters from the source extension and upsert into the cache. */
async function fetchAndCacheChapters(
  pb: PocketBase,
  sourceId: string,
  seriesId: string,
): Promise<SourceChapter[]> {
  const source = getSource(sourceId);
  if (!source) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Unknown source: ${sourceId}`,
    });
  }

  const chapters = await source.fetchChapterList(seriesId);
  const cacheId = toChapterCacheId(sourceId, seriesId);
  const data = {
    sourceId,
    seriesId,
    chapters: JSON.stringify(chapters),
    cachedAt: Date.now(),
  };

  try {
    await pb.collection("chapterCache").update(cacheId, data);
  } catch {
    // Record doesn't exist yet — create it
    await pb.collection("chapterCache").create({ id: cacheId, ...data });
  }

  return chapters;
}

const chapterInput = z.object({
  sourceId: z.string().min(1),
  seriesId: z.string().min(1),
});

export const sourceRouter = createTRPCRouter({
  fetchChapters: baseProcedure
    .input(chapterInput)
    .query(async ({ input, ctx }): Promise<SourceChapter[]> => {
      const { sourceId, seriesId } = input;
      const cacheId = toChapterCacheId(sourceId, seriesId);

      // Try cache first
      try {
        const cached = await ctx.pb
          .collection("chapterCache")
          .getOne(cacheId);
        return cached.chapters as SourceChapter[];
      } catch {
        // Cache miss — fetch from source
      }

      try {
        return await fetchAndCacheChapters(ctx.pb, sourceId, seriesId);
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message:
            err instanceof Error ? err.message : "Failed to fetch chapters",
        });
      }
    }),

  refreshChapters: baseProcedure
    .input(chapterInput)
    .mutation(async ({ input, ctx }): Promise<SourceChapter[]> => {
      const { sourceId, seriesId } = input;
      try {
        return await fetchAndCacheChapters(ctx.pb, sourceId, seriesId);
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message:
            err instanceof Error ? err.message : "Failed to refresh chapters",
        });
      }
    }),
});
