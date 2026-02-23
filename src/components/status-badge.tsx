import { Badge } from "@/components/ui/badge";
import { DownloadStatus } from "@/lib/types";
import { statusConfig } from "@/lib/manga-utils";

export function StatusBadge({ status }: { status: DownloadStatus }) {
  const config = statusConfig[status];
  return (
    <Badge
      variant="outline"
      className={`rounded-none font-mono text-[0.65rem] tracking-wider ${config.textClass} ${config.borderClass} bg-transparent`}
    >
      {config.label}
    </Badge>
  );
}
