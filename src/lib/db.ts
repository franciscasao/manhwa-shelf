import Dexie, { type EntityTable } from "dexie";
import { Manga } from "@/lib/types";
import type { WebtoonCache } from "@/lib/webtoon";

const db = new Dexie("manhwa-shelf") as Dexie & {
  shelf: EntityTable<Manga, "id">;
  webtoonCache: EntityTable<WebtoonCache, "titleId">;
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

export { db };
