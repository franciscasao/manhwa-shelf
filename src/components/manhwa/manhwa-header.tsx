import Image from "next/image";
import { AniListMediaDetail } from "@/lib/anilist";
import { Manga } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";
import { getDownloadStatus } from "@/lib/manga-utils";
import { Plus, Check, Trash2 } from "lucide-react";

interface ManhwaHeaderProps {
  media: AniListMediaDetail;
  shelfEntry: Manga | undefined;
  onAdd: () => void;
  onRemove: () => void;
  readOnly?: boolean;
}

export function ManhwaHeader({
  media,
  shelfEntry,
  onAdd,
  onRemove,
  readOnly,
}: ManhwaHeaderProps) {
  const title = media.title.english ?? media.title.romaji;
  const romaji = media.title.english ? media.title.romaji : null;
  const isOnShelf = !!shelfEntry;
  const status = shelfEntry ? getDownloadStatus(shelfEntry) : null;
  const score =
    media.averageScore != null ? (media.averageScore / 10).toFixed(1) : null;
  const chaptersStr =
    media.chapters != null ? `${media.chapters} ch` : "ongoing";

  return (
    <div className="flex flex-col md:flex-row gap-5 md:gap-6">
      {/* Cover */}
      <div className="relative w-[200px] md:w-[250px] shrink-0 self-center md:self-start">
        <div className="relative aspect-[3/4] overflow-hidden border border-terminal-border/60">
          <Image
            src={media.coverImage.large}
            alt={title}
            fill
            sizes="(max-width: 768px) 200px, 250px"
            className="object-cover contrast-[1.15] saturate-[0.65] opacity-85"
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
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-[0.6rem] text-terminal-dim mb-1 tracking-widest">
          FILE INSPECTOR — MEDIA #{media.id}
        </div>

        <h1 className="text-lg md:text-xl text-terminal-green font-bold leading-tight mb-1 break-words">
          {title}
        </h1>
        {romaji && (
          <div className="text-xs text-terminal-dim mb-3">{romaji}</div>
        )}

        <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
          {status && <StatusBadge status={status} />}
          {media.status && (
            <span className="border border-terminal-border px-2 py-0.5 text-terminal-muted">
              {media.status.replace(/_/g, " ")}
            </span>
          )}
          {score && <span className="text-terminal-orange">★ {score}</span>}
          <span className="text-terminal-dim">{chaptersStr}</span>
          {media.countryOfOrigin && (
            <span className="text-terminal-dim border border-terminal-border/40 px-1.5 py-0.5">
              {media.countryOfOrigin}
            </span>
          )}
        </div>

        {/* Genres */}
        {media.genres.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {media.genres.map((g) => (
              <span
                key={g}
                className="border border-terminal-cyan/30 bg-terminal-cyan/[0.05] px-2 py-0.5 text-[0.65rem] text-terminal-cyan"
              >
                {g}
              </span>
            ))}
          </div>
        )}

        {/* Add/Remove button */}
        {!readOnly && (
          isOnShelf ? (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs text-terminal-green">
                <Check className="h-3.5 w-3.5" />
                ON SHELF
              </span>
              <button
                onClick={onRemove}
                className="flex items-center gap-1 text-xs text-terminal-dim hover:text-red-500 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
                remove
              </button>
            </div>
          ) : (
            <button
              onClick={onAdd}
              className="flex items-center gap-1.5 border border-terminal-cyan/40 px-3 py-1.5 text-xs text-terminal-cyan hover:bg-terminal-cyan/10 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />[ ADD TO SHELF ]
            </button>
          )
        )}
      </div>
    </div>
  );
}
