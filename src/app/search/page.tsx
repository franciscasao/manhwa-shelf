"use client";

import { useState, useEffect } from "react";
import { MangaCard } from "@/components/manga-card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AniListMedia, searchManhwa, mapAniListToManga } from "@/lib/anilist";
import { useShelf } from "@/hooks/use-shelf";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AniListMedia[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const { addToShelf, isOnShelf } = useShelf();

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setHasSearched(false);
      setError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await searchManhwa(query.trim());
        setResults(data);
        setHasSearched(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Search failed");
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Search</h1>
      <p className="text-muted-foreground mt-1">
        Search AniList for manhwa to add to your shelf
      </p>

      <div className="mt-6">
        <Input
          placeholder="Search manhwa by title..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="sm:max-w-sm"
        />
      </div>

      <div className="mt-6">
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="aspect-[3/4] w-full rounded" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        )}

        {error && !isLoading && (
          <p className="font-mono text-terminal-orange text-sm">{"> ERR: "}{error}</p>
        )}

        {!isLoading && !error && hasSearched && results.length === 0 && (
          <p className="font-mono text-terminal-muted text-sm">
            {`> no results found for "${query}"`}
          </p>
        )}

        {!isLoading && !error && !hasSearched && (
          <p className="font-mono text-terminal-muted text-sm">
            {">"} type to search anilist...
            <span className="blink-cursor">_</span>
          </p>
        )}

        {!isLoading && !error && results.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {results.map((media) => {
              const manga = mapAniListToManga(media);
              const onShelf = isOnShelf(manga.id);
              return (
                <div key={manga.id} className="flex flex-col gap-2">
                  <MangaCard manga={manga} />
                  <button
                    onClick={() => !onShelf && addToShelf(manga)}
                    disabled={onShelf}
                    className={`w-full border font-mono text-xs py-1 transition-colors ${
                      onShelf
                        ? "border-terminal-green text-terminal-green cursor-default"
                        : "border-terminal-cyan text-terminal-cyan hover:bg-terminal-cyan/10 cursor-pointer"
                    }`}
                  >
                    {onShelf ? "[ ON SHELF ]" : "[ + ADD ]"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
