import { Progress } from "@/components/ui/progress";
import { Manga } from "@/lib/types";
import { getDownloadStatus, getPercent, statusConfig } from "@/lib/manga-utils";

export function ProgressDisplay({ manga }: { manga: Manga }) {
  const status = getDownloadStatus(manga);
  const pct = getPercent(manga);
  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2 min-w-[140px]">
      <Progress
        value={pct}
        className={`h-1.5 w-20 rounded-none bg-terminal-muted/50 ${config.progressClass}`}
      />
      <span className={`text-xs tabular-nums ${config.textClass}`}>
        {pct.toString().padStart(3, "\u00A0")}%
      </span>
    </div>
  );
}
