"use client";

import { useState, useEffect, useCallback } from "react";
import { pb } from "@/lib/db";
import { Manga } from "@/lib/types";

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

export function useShelf() {
  const [shelf, setShelf] = useState<Manga[] | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    // Initial fetch
    pb.collection("shelf")
      .getFullList({ sort: "-lastUpdated" })
      .then((records) => {
        if (!cancelled) {
          setShelf(records.map(recordToManga));
        }
      })
      .catch((err) => {
        console.error("Failed to fetch shelf:", err);
        if (!cancelled) setShelf([]);
      });

    // Real-time subscription for cross-device sync
    pb.collection("shelf").subscribe("*", (e) => {
      setShelf((prev) => {
        const current = prev ?? [];
        if (e.action === "create") {
          return [...current, recordToManga(e.record)];
        }
        if (e.action === "update") {
          return current.map((m) =>
            m.id === e.record["id"] ? recordToManga(e.record) : m,
          );
        }
        if (e.action === "delete") {
          return current.filter((m) => m.id !== e.record["id"]);
        }
        return current;
      });
    });

    return () => {
      cancelled = true;
      pb.collection("shelf").unsubscribe("*");
    };
  }, []);

  const addToShelf = useCallback(async (manga: Manga) => {
    try {
      // Try to update existing record first
      await pb.collection("shelf").update(manga.id, manga);
    } catch {
      // If not found, create new
      await pb.collection("shelf").create({ ...manga, id: manga.id });
    }
  }, []);

  const removeFromShelf = useCallback(async (id: string) => {
    await pb.collection("shelf").delete(id);
  }, []);

  const isOnShelf = useCallback(
    (id: string): boolean => {
      return shelf?.some((m) => m.id === id) ?? false;
    },
    [shelf],
  );

  return {
    shelf: shelf ?? [],
    isHydrated: shelf !== undefined,
    addToShelf,
    removeFromShelf,
    isOnShelf,
  };
}
