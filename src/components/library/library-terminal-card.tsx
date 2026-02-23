import { Trash2 } from "lucide-react";
import { Manga } from "@/lib/types";
import { getDownloadStatus, getPercent, statusConfig } from "@/lib/manga-utils";
import { StatusBadge } from "@/components/status-badge";
import { ProgressDisplay } from "@/components/progress-display";

interface LibraryTerminalCardProps {
  manga: Manga;
  index: number;
  onRemove: (id: string) => void;
}

export function LibraryTerminalCard({ manga, index, onRemove }: LibraryTerminalCardProps) {
  const status = getDownloadStatus(manga);
  const config = statusConfig[status];
  const isGhost = status === "not-downloaded";
  const chaptersStr = manga.chapters.total
    ? `${manga.chapters.downloaded}/${manga.chapters.total}`
    : `${manga.chapters.downloaded}/?`;

  return (
    <div
      className="shelf-card group relative flex flex-col border border-terminal-border/40 bg-terminal-bg transition-all hover:border-terminal-cyan/40 hover:shadow-[0_0_12px_rgba(0,212,255,0.08)]"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {/* Left accent strip */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-[2px] bg-${config.color}`}
      />

      {/* Cover image */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-terminal-bg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={manga.coverImage}
          alt={manga.title}
          className={`h-full w-full object-cover contrast-[1.15] saturate-[0.65] ${
            isGhost ? "opacity-30 grayscale" : "opacity-85 group-hover:opacity-95"
          } transition-opacity`}
        />
        {/* Scanline overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "repeating-linear-gradient(0deg, rgba(0,0,0,0.25) 0px, rgba(0,0,0,0.25) 1px, transparent 1px, transparent 2px)",
          }}
        />
        {/* Rating badge */}
        {manga.rating > 0 && (
          <div className="absolute top-1 right-1 bg-terminal-bg/80 px-1.5 py-0.5 text-[0.6rem] font-mono text-terminal-orange">
            ★ {manga.rating}
          </div>
        )}
      </div>

      {/* Info area */}
      <div className="flex flex-col gap-1 px-2 py-2 text-xs">
        <div className="flex items-start gap-1">
          <span className="text-terminal-dim shrink-0">{">"}</span>
          <span className={`${config.textClass} line-clamp-1 font-medium leading-tight`}>
            {manga.title}
          </span>
        </div>
        <div className="text-terminal-dim text-[0.6rem] line-clamp-1 pl-3">
          {manga.author}
        </div>

        <div className="mt-1">
          <ProgressDisplay manga={manga} />
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status={status} />
          <span className="text-[0.6rem] text-terminal-muted tabular-nums ml-auto">
            {chaptersStr} ch
          </span>
        </div>
        <div className="text-[0.6rem] text-terminal-dim tabular-nums pl-3">
          {manga.sizeOnDisk}
        </div>
      </div>

      {/* Remove button — visible on hover */}
      <button
        onClick={() => onRemove(manga.id)}
        className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1.5 border-t border-terminal-border/40 bg-terminal-bg/95 py-1.5 text-xs font-mono text-terminal-orange opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
      >
        <Trash2 className="h-3 w-3" />
        [ REMOVE ]
      </button>
    </div>
  );
}
