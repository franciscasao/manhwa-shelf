import Image from "next/image";
import { Manga } from "@/lib/types";
import { getDownloadStatus, statusConfig } from "@/lib/manga-utils";
import { StatusBadge } from "@/components/status-badge";
import { ProgressDisplay } from "@/components/progress-display";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function SortIcon() {
  return <span className="text-[0.6rem] text-terminal-muted">{"▲▼"}</span>;
}

export function MangaTable({ manga }: { manga: Manga[] }) {
  return (
    <Table className="text-[0.8rem] [&_tr]:border-terminal-border/40">
      <TableHeader>
        <TableRow className="border-terminal-border hover:bg-transparent">
          <TableHead className="text-[0.7rem] font-bold tracking-widest text-terminal-cyan">
            STATUS <SortIcon />
          </TableHead>
          <TableHead className="text-[0.7rem] font-bold tracking-widest text-terminal-cyan">
            TITLE <SortIcon />
          </TableHead>
          <TableHead className="hidden text-[0.7rem] font-bold tracking-widest text-terminal-cyan md:table-cell">
            AUTHOR <SortIcon />
          </TableHead>
          <TableHead className="text-[0.7rem] font-bold tracking-widest text-terminal-cyan">
            PROGRESS <SortIcon />
          </TableHead>
          <TableHead className="text-[0.7rem] font-bold tracking-widest text-terminal-cyan">
            CHS <SortIcon />
          </TableHead>
          <TableHead className="text-[0.7rem] font-bold tracking-widest text-terminal-cyan">
            SIZE <SortIcon />
          </TableHead>
          <TableHead className="hidden text-[0.7rem] font-bold tracking-widest text-terminal-cyan md:table-cell">
            LAST SYNC <SortIcon />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {manga.map((m) => {
          const status = getDownloadStatus(m);
          const config = statusConfig[status];
          const isPartial = status === "partial";
          const chaptersStr = m.chapters.total
            ? `${m.chapters.downloaded}/${m.chapters.total}`
            : `${m.chapters.downloaded}/?`;

          return (
            <TableRow
              key={m.id}
              className="border-terminal-border/20 transition-colors hover:bg-terminal-row-hover"
            >
              {/* STATUS */}
              <TableCell>
                <StatusBadge status={status} />
              </TableCell>

              {/* TITLE with cover image */}
              <TableCell>
                <div className="flex items-center gap-2">
                  <div
                    className={`relative h-[38px] w-[28px] shrink-0 overflow-hidden border ${config.borderClass} bg-terminal-bg`}
                  >
                    <Image
                      src={m.coverImage}
                      alt={m.title}
                      fill
                      sizes="28px"
                      className={`object-cover contrast-[1.2] saturate-[0.6] ${
                        status === "not-downloaded"
                          ? "opacity-30"
                          : "opacity-85"
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
                  <div>
                    <span className="text-terminal-dim">{">"} </span>
                    <span className={config.textClass}>{m.title}</span>
                    {isPartial && (
                      <span className="blink-cursor text-terminal-cyan">_</span>
                    )}
                  </div>
                </div>
              </TableCell>

              {/* AUTHOR */}
              <TableCell className="hidden text-terminal-dim md:table-cell">
                {m.author}
              </TableCell>

              {/* PROGRESS */}
              <TableCell>
                <ProgressDisplay manga={m} />
              </TableCell>

              {/* CHAPTERS */}
              <TableCell className="tabular-nums text-[#888]">
                {chaptersStr}
              </TableCell>

              {/* SIZE */}
              <TableCell
                className={
                  m.sizeOnDisk === "0 MB"
                    ? "text-terminal-muted"
                    : "text-terminal-cyan"
                }
              >
                {m.sizeOnDisk}
              </TableCell>

              {/* LAST SYNC */}
              <TableCell className="hidden text-[#444] md:table-cell">
                {m.lastUpdated || "--"}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
