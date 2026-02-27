import { z } from "zod";
import { createTRPCRouter, baseProcedure } from "@/trpc/init";
import { getSource, type SourceChapter } from "@/extensions";
import { TRPCError } from "@trpc/server";

export const sourceRouter = createTRPCRouter({
  fetchChapters: baseProcedure
    .input(
      z.object({
        sourceId: z.string().min(1),
        seriesId: z.string().min(1),
      }),
    )
    .query(async ({ input }): Promise<SourceChapter[]> => {
      const source = getSource(input.sourceId);
      if (!source) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Unknown source: ${input.sourceId}`,
        });
      }

      try {
        return await source.fetchChapterList(input.seriesId);
      } catch (err) {
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message: err instanceof Error ? err.message : "Failed to fetch chapters",
        });
      }
    }),
});
