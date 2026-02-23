import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Manga } from "@/lib/types";
import { getDownloadStatus, statusConfig } from "@/lib/manga-utils";
import { StatusBadge } from "@/components/status-badge";
import { ProgressDisplay } from "@/components/progress-display";

interface LibraryListRowProps {
  manga: Manga;
  index: number;
  onRemove: (id: string) => void;
}

export function LibraryListRow({ manga, index, onRemove }: LibraryListRowProps) {
  const status = getDownloadStatus(manga);
  const config = statusConfig[status];
  const isGhost = status === "not-downloaded";
  const chaptersStr = manga.chapters.total
    ? `${manga.chapters.downloaded}/${manga.chapters.total}`
    : `${manga.chapters.downloaded}/?`;

  return (
    <div
      className="shelf-card group relative flex items-center gap-3 border border-terminal-border/30 px-3 py-1.5 transition-colors hover:bg-terminal-row-hover"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      {/* Left accent strip */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-[2px] bg-${config.color}`}
      />

      <Link href={`/manhwa/${manga.id}`} className="flex items-center gap-3 flex-1 min-w-0">
        {/* Mini cover */}
        <div className="relative h-[42px] w-[30px] shrink-0 overflow-hidden bg-terminal-bg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={manga.coverImage}
            alt={manga.title}
            className={`h-full w-full object-cover contrast-[1.15] saturate-[0.65] ${
              isGhost ? "opacity-30 grayscale" : "opacity-85"
            }`}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "repeating-linear-gradient(0deg, rgba(0,0,0,0.25) 0px, rgba(0,0,0,0.25) 1px, transparent 1px, transparent 2px)",
            }}
          />
        </div>

        {/* Title + author */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span className="text-terminal-dim text-xs">{">"}</span>
            <span className={`${config.textClass} text-xs font-medium truncate`}>
              {manga.title}
            </span>
          </div>
          <div className="text-[0.6rem] text-terminal-dim truncate pl-3">
            {manga.author}
          </div>
        </div>

        {/* Status */}
        <div className="shrink-0">
          <StatusBadge status={status} />
        </div>

        {/* Progress */}
        <div className="hidden sm:block shrink-0">
          <ProgressDisplay manga={manga} />
        </div>

        {/* Chapters */}
        <div className="hidden md:block shrink-0 text-xs text-terminal-muted tabular-nums w-16 text-right">
          {chaptersStr}
        </div>

        {/* Size */}
        <div className="hidden md:block shrink-0 text-xs text-terminal-dim tabular-nums w-16 text-right">
          {manga.sizeOnDisk}
        </div>

        {/* Rating */}
        <div className="hidden lg:block shrink-0 text-xs text-terminal-orange tabular-nums w-10 text-right">
          {manga.rating > 0 ? `★ ${manga.rating}` : "—"}
        </div>
      </Link>

      {/* Remove button */}
      <button
        onClick={() => onRemove(manga.id)}
        className="shrink-0 text-terminal-dim opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
