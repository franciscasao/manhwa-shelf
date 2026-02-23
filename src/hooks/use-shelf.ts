"use client";

import { useState, useEffect } from "react";
import { Manga } from "@/lib/types";

const STORAGE_KEY = "manhwa-shelf-items";

export function useShelf() {
  const [shelf, setShelf] = useState<Manga[] | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setShelf(stored ? JSON.parse(stored) : []);
    } catch {
      setShelf([]);
    }
  }, []);

  useEffect(() => {
    if (shelf === null) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(shelf));
    } catch {
      // ignore storage errors
    }
  }, [shelf]);

  const addToShelf = (manga: Manga) => {
    setShelf((prev) => {
      if (prev === null) return [manga];
      if (prev.some((m) => m.id === manga.id)) return prev;
      return [...prev, manga];
    });
  };

  const removeFromShelf = (id: string) => {
    setShelf((prev) => (prev === null ? [] : prev.filter((m) => m.id !== id)));
  };

  const isOnShelf = (id: string): boolean => {
    return shelf?.some((m) => m.id === id) ?? false;
  };

  return {
    shelf: shelf ?? [],
    isHydrated: shelf !== null,
    addToShelf,
    removeFromShelf,
    isOnShelf,
  };
}
