import { NextRequest, NextResponse } from "next/server";
import { getServerPB } from "@/lib/db-server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ mangaId: string; chapterNum: string }> },
) {
  const { mangaId, chapterNum } = await params;
  const num = Number(chapterNum);

  if (!mangaId || isNaN(num)) {
    return NextResponse.json(
      { error: "Invalid mangaId or chapterNum" },
      { status: 400 },
    );
  }

  const pb = getServerPB();

  try {
    // Fetch the specific chapter
    const chapter = await pb
      .collection("chapterDownloads")
      .getFirstListItem(`mangaId = "${mangaId}" && chapterNum = ${num}`);

    // Fetch all chapter numbers for this manga to compute prev/next
    const allChapters = await pb
      .collection("chapterDownloads")
      .getFullList({
        filter: `mangaId = "${mangaId}"`,
        fields: "chapterNum",
        sort: "chapterNum",
      });

    const chapterNums = allChapters
      .map((c) => c.chapterNum as number)
      .sort((a, b) => a - b);

    const currentIdx = chapterNums.indexOf(num);
    const prevChapter = currentIdx > 0 ? chapterNums[currentIdx - 1] : null;
    const nextChapter =
      currentIdx < chapterNums.length - 1
        ? chapterNums[currentIdx + 1]
        : null;

    return NextResponse.json({
      recordId: chapter.id,
      collectionId: chapter.collectionId,
      images: chapter.images as string[],
      episodeTitle: (chapter.episodeTitle as string) || `Chapter ${num}`,
      chapterNum: num,
      prevChapter,
      nextChapter,
    });
  } catch {
    return NextResponse.json(
      { error: "Chapter not found" },
      { status: 404 },
    );
  }
}
