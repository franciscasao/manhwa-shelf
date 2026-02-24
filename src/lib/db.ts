import Dexie, { type EntityTable, type Table } from "dexie";
import { Manga } from "@/lib/types";
import type { WebtoonCache } from "@/lib/webtoon";

export interface ChapterDownloadRecord {
  mangaId: string;
  chapterNum: number;
  episodeTitle: string;
  filePath: string;
  sizeBytes: number;
  downloadedAt: number;
}

const db = new Dexie("manhwa-shelf") as Dexie & {
  shelf: EntityTable<Manga, "id">;
  webtoonCache: EntityTable<WebtoonCache, "titleId">;
  chapterDownloads: Table<ChapterDownloadRecord, [string, number]>;
};

db.version(1).stores({
  shelf: "id, title, author, rating, lastUpdated",
});

db.version(2).stores({
  shelf: "id, title, author, rating, lastUpdated, origin",
}).upgrade(tx => {
  return tx.table("shelf").toCollection().modify(entry => {
    if (!entry.origin) {
      entry.origin = "KR";
    }
  });
});

db.version(3).stores({
  shelf: "id, title, author, rating, lastUpdated, origin",
  webtoonCache: "titleId",
});

db.version(4).stores({
  shelf: "id, title, author, rating, lastUpdated, origin",
  webtoonCache: "titleId",
  chapterDownloads: "[mangaId+chapterNum], mangaId",
});

export { db };
