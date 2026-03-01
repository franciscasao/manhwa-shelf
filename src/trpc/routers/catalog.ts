import { z } from "zod";
import { createTRPCRouter, baseProcedure } from "@/trpc/init";
import type { Manga } from "@/lib/types";

function recordToManga(record: Record<string, unknown>): Manga {
  return {
    id: record["id"] as string,
    title: record["title"] as string,
    author: record["author"] as string,
    coverImage: record["coverImage"] as string,
    genres: record["genres"] as string[],
    rating: record["rating"] as number,
    chapters: record["chapters"] as { downloaded: number; total: number | null },
    sizeOnDisk: record["sizeOnDisk"] as string,
    lastUpdated: record["lastUpdated"] as string,
    origin: record["origin"] as Manga["origin"],
  };
}

export const catalogRouter = createTRPCRouter({
  getPublicCatalog: baseProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        perPage: z.number().int().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { pb } = ctx;
      const result = await pb.collection("shelf").getList(input.page, input.perPage, {
        sort: "-lastUpdated",
        filter: "chapters.downloaded > 0",
      });

      return {
        items: result.items.map(recordToManga),
        totalItems: result.totalItems,
        totalPages: result.totalPages,
      };
    }),

  getDownloadedChapters: baseProcedure
    .input(z.object({ mangaId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const { pb } = ctx;
      const records = await pb.collection("chapterDownloads").getFullList({
        filter: `mangaId = "${input.mangaId}"`,
        fields: "chapterNum,episodeTitle",
        sort: "chapterNum",
      });

      return records.map((r) => ({
        chapterNum: r.chapterNum as number,
        title: (r.episodeTitle as string) || `Chapter ${r.chapterNum}`,
      }));
    }),

  getStats: baseProcedure.query(async ({ ctx }) => {
    const { pb } = ctx;
    const allShelf = await pb.collection("shelf").getFullList({
      fields: "chapters,sizeOnDisk",
      filter: "chapters.downloaded > 0",
    });

    let totalChapters = 0;
    let totalSizeBytes = 0;

    for (const record of allShelf) {
      const chapters = record["chapters"] as { downloaded: number; total: number | null };
      totalChapters += chapters.downloaded;

      const sizeStr = record["sizeOnDisk"] as string;
      if (sizeStr) {
        const match = sizeStr.match(/([\d.]+)\s*(GB|MB|KB|B)/i);
        if (match) {
          const value = parseFloat(match[1]);
          const unit = match[2].toUpperCase();
          if (unit === "GB") totalSizeBytes += value * 1024 * 1024 * 1024;
          else if (unit === "MB") totalSizeBytes += value * 1024 * 1024;
          else if (unit === "KB") totalSizeBytes += value * 1024;
          else totalSizeBytes += value;
        }
      }
    }

    return {
      totalTitles: allShelf.length,
      totalChapters,
      totalSizeGB: totalSizeBytes / (1024 * 1024 * 1024),
    };
  }),
});
