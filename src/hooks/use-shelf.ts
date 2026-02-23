"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { Manga } from "@/lib/types";

export function useShelf() {
  const shelf = useLiveQuery(() => db.shelf.toArray());

  const addToShelf = (manga: Manga) => {
    db.shelf.put(manga);
  };

  const removeFromShelf = (id: string) => {
    db.shelf.delete(id);
  };

  const isOnShelf = (id: string): boolean => {
    return shelf?.some((m) => m.id === id) ?? false;
  };

  return {
    shelf: shelf ?? [],
    isHydrated: shelf !== undefined,
    addToShelf,
    removeFromShelf,
    isOnShelf,
  };
}
