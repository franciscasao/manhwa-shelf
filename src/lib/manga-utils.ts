import { Manga, DownloadStatus, SortValue } from "@/lib/types";

export function toPocketBaseId(anilistId: number | string): string {
  return String(anilistId).padStart(15, "0");
}

export function getDownloadStatus(manga: Manga): DownloadStatus {
  if (manga.chapters.downloaded === 0) return "not-downloaded";
  if (manga.chapters.total && manga.chapters.downloaded >= manga.chapters.total)
    return "complete";
  return "partial";
}

export function getPercent(manga: Manga): number {
  const status = getDownloadStatus(manga);
  if (status === "not-downloaded") return 0;
  if (status === "complete") return 100;
  const total = manga.chapters.total ?? manga.chapters.downloaded;
  return total > 0 ? Math.round((manga.chapters.downloaded / total) * 100) : 0;
}

export function parseSizeGB(sizeStr: string): number {
  const match = sizeStr.match(/([\d.]+)\s*(GB|MB)/i);
  if (!match) return 0;
  const val = parseFloat(match[1]);
  return match[2].toUpperCase() === "GB" ? val : val / 1024;
}

export function sortManga(manga: Manga[], sortBy: SortValue): Manga[] {
  const sorted = [...manga];
  switch (sortBy) {
    case "title":
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case "rating":
      return sorted.sort((a, b) => b.rating - a.rating);
    case "chapters":
      return sorted.sort(
        (a, b) => b.chapters.downloaded - a.chapters.downloaded,
      );
    case "size":
      return sorted.sort(
        (a, b) => parseSizeGB(b.sizeOnDisk) - parseSizeGB(a.sizeOnDisk),
      );
    case "updated":
      return sorted.sort((a, b) =>
        (b.lastUpdated || "").localeCompare(a.lastUpdated || ""),
      );
    default:
      return sorted;
  }
}

export const statusConfig: Record<
  DownloadStatus,
  {
    label: string;
    color: string;
    textClass: string;
    borderClass: string;
    progressClass: string;
  }
> = {
  complete: {
    label: "DONE",
    color: "terminal-green",
    textClass: "text-terminal-green",
    borderClass: "border-terminal-green",
    progressClass: "[&>[data-slot=progress-indicator]]:bg-terminal-green",
  },
  partial: {
    label: "SYNC",
    color: "terminal-cyan",
    textClass: "text-terminal-cyan",
    borderClass: "border-terminal-cyan",
    progressClass: "[&>[data-slot=progress-indicator]]:bg-terminal-cyan",
  },
  queued: {
    label: "WAIT",
    color: "terminal-orange",
    textClass: "text-terminal-orange",
    borderClass: "border-terminal-orange",
    progressClass: "[&>[data-slot=progress-indicator]]:bg-terminal-orange",
  },
  "not-downloaded": {
    label: "NONE",
    color: "terminal-dim",
    textClass: "text-terminal-dim",
    borderClass: "border-terminal-dim",
    progressClass: "[&>[data-slot=progress-indicator]]:bg-terminal-dim",
  },
};
