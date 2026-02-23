import { Badge } from "@/components/ui/badge";
import { DownloadStatus } from "@/lib/types";

const statusConfig: Record<DownloadStatus, { label: string; className: string }> = {
  complete: { label: "Complete", className: "bg-green-500/15 text-green-700 border-green-500/25 dark:text-green-400" },
  partial: { label: "Partial", className: "bg-blue-500/15 text-blue-700 border-blue-500/25 dark:text-blue-400" },
  queued: { label: "Queued", className: "bg-amber-500/15 text-amber-700 border-amber-500/25 dark:text-amber-400" },
  "not-downloaded": { label: "Not Downloaded", className: "bg-red-500/15 text-red-700 border-red-500/25 dark:text-red-400" },
};

export function StatusBadge({ status }: { status: DownloadStatus }) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
