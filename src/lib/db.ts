import Dexie, { type EntityTable } from "dexie";
import { Manga } from "@/lib/types";

const db = new Dexie("manhwa-shelf") as Dexie & {
  shelf: EntityTable<Manga, "id">;
};

db.version(1).stores({
  shelf: "id, title, author, rating, lastUpdated",
});

export { db };
