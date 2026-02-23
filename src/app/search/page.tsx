"use client";

import { useState, useMemo } from "react";
import { MangaCard } from "@/components/manga-card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sampleManga } from "@/data/sample";
import { DownloadStatus, Manga } from "@/lib/types";

function getDownloadStatus(manga: Manga): DownloadStatus {
  if (manga.chapters.downloaded === 0) return "not-downloaded";
  if (manga.chapters.total && manga.chapters.downloaded >= manga.chapters.total) return "complete";
  return "partial";
}

const allGenres = Array.from(
  new Set(sampleManga.flatMap((m) => m.genres))
).sort();

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<DownloadStatus | "all">("all");
  const [genreFilter, setGenreFilter] = useState<string>("all");

  const results = useMemo(() => {
    return sampleManga.filter((manga) => {
      const matchesQuery =
        !query ||
        manga.title.toLowerCase().includes(query.toLowerCase()) ||
        manga.author.toLowerCase().includes(query.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || getDownloadStatus(manga) === statusFilter;
      const matchesGenre =
        genreFilter === "all" || manga.genres.includes(genreFilter);
      return matchesQuery && matchesStatus && matchesGenre;
    });
  }, [query, statusFilter, genreFilter]);

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Search</h1>
      <p className="text-muted-foreground mt-1">
        Find manga &amp; manhwa in your collection
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <Input
          placeholder="Search by title or author..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="sm:max-w-sm"
        />
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as DownloadStatus | "all")}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="complete">Complete</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="not-downloaded">Not Downloaded</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={genreFilter}
          onValueChange={setGenreFilter}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Genre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Genres</SelectItem>
            {allGenres.map((genre) => (
              <SelectItem key={genre} value={genre}>
                {genre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
        {results.map((manga) => (
          <MangaCard key={manga.id} manga={manga} />
        ))}
      </div>

      {results.length === 0 && (
        <p className="text-center text-muted-foreground py-12">
          No results found. Try adjusting your search or filters.
        </p>
      )}
    </div>
  );
}
