import { z } from "zod";
import { createTRPCRouter, baseProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";

export interface ChapterReaderRaw {
  recordId: string;
  collectionId: string;
  images: string[];
  episodeTitle: string;
  chapterNum: number;
  prevChapter: number | null;
  nextChapter: number | null;
}

export const chapterRouter = createTRPCRouter({
  getReader: baseProcedure
    .input(
      z.object({
        mangaId: z.string().min(1),
        chapterNum: z.number().int().positive(),
      }),
    )
    .query(async ({ ctx, input }): Promise<ChapterReaderRaw> => {
      const { pb } = ctx;
      const { mangaId, chapterNum } = input;

      try {
        const chapter = await pb
          .collection("chapterDownloads")
          .getFirstListItem(`mangaId = "${mangaId}" && chapterNum = ${chapterNum}`);

        const allChapters = await pb.collection("chapterDownloads").getFullList({
          filter: `mangaId = "${mangaId}"`,
          fields: "chapterNum",
          sort: "chapterNum",
        });

        const chapterNums = allChapters
          .map((c) => c.chapterNum as number)
          .sort((a, b) => a - b);

        const currentIdx = chapterNums.indexOf(chapterNum);
        const prevChapter = currentIdx > 0 ? chapterNums[currentIdx - 1] : null;
        const nextChapter =
          currentIdx < chapterNums.length - 1 ? chapterNums[currentIdx + 1] : null;

        return {
          recordId: chapter.id,
          collectionId: chapter.collectionId,
          images: chapter.images as string[],
          episodeTitle: (chapter.episodeTitle as string) || `Chapter ${chapterNum}`,
          chapterNum,
          prevChapter,
          nextChapter,
        };
      } catch {
        throw new TRPCError({ code: "NOT_FOUND", message: "Chapter not found" });
      }
    }),
});
