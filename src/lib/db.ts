import PocketBase from "pocketbase";

export interface ChapterDownloadRecord {
  mangaId: string;
  chapterNum: number;
  episodeTitle: string;
  filePath: string;
  sizeBytes: number;
  downloadedAt: number;
}

const pb = new PocketBase(
  process.env.NEXT_PUBLIC_POCKETBASE_URL ?? "http://127.0.0.1:8090",
);

// Disable auto-cancellation so concurrent requests don't cancel each other
pb.autoCancellation(false);

export { pb };
