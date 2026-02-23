"use client";

import { sampleManga } from "@/data/sample";
import { Manga, DownloadStatus } from "@/lib/types";
import { JetBrains_Mono } from "next/font/google";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
});

function getDownloadStatus(manga: Manga): DownloadStatus {
  if (manga.chapters.downloaded === 0) return "not-downloaded";
  if (manga.chapters.total && manga.chapters.downloaded >= manga.chapters.total)
    return "complete";
  return "partial";
}

function getPercent(manga: Manga): number {
  const status = getDownloadStatus(manga);
  if (status === "not-downloaded") return 0;
  if (status === "complete") return 100;
  const total = manga.chapters.total ?? manga.chapters.downloaded;
  return total > 0 ? Math.round((manga.chapters.downloaded / total) * 100) : 0;
}

const statusConfig: Record<
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

function StatusBadge({ status }: { status: DownloadStatus }) {
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

function ProgressDisplay({ manga }: { manga: Manga }) {
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

export default function Home() {
  const totalTitles = sampleManga.length;
  const totalChapters = sampleManga.reduce(
    (sum, m) => sum + m.chapters.downloaded,
    0,
  );
  const totalSizeGB = sampleManga.reduce((sum, m) => {
    const match = m.sizeOnDisk.match(/([\d.]+)\s*(GB|MB)/i);
    if (!match) return sum;
    const val = parseFloat(match[1]);
    return sum + (match[2].toUpperCase() === "GB" ? val : val / 1024);
  }, 0);

  return (
    <div
      className={`${jetbrainsMono.className} relative min-h-screen overflow-hidden bg-terminal-bg text-terminal-green`}
    >
      {/* CRT scan-line overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-50"
        style={{
          background:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 3px)",
        }}
      />

      {/* Keyframes */}
      <style>{`
        @keyframes blink-cursor {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .blink-cursor {
          animation: blink-cursor 1s step-end infinite;
        }
        @keyframes flicker {
          0% { opacity: 0.97; }
          5% { opacity: 0.95; }
          10% { opacity: 0.98; }
          15% { opacity: 0.96; }
          20% { opacity: 0.99; }
          50% { opacity: 0.96; }
          80% { opacity: 0.98; }
          100% { opacity: 0.97; }
        }
      `}</style>

      <div className="relative z-10 mx-auto max-w-[1200px] animate-[flicker_4s_infinite] px-3 py-6 md:px-8 md:py-10">
        {/* Header */}
        <div className="mb-6 border-b border-terminal-border pb-4">
          <pre className="mb-4 hidden select-none text-[0.65rem] leading-tight text-terminal-green md:block">
            {`
 ███╗   ███╗ █████╗ ███╗   ██╗██╗  ██╗██╗    ██╗ █████╗       ███████╗██╗  ██╗███████╗██╗     ███████╗
 ████╗ ████║██╔══██╗████╗  ██║██║  ██║██║    ██║██╔══██╗      ██╔════╝██║  ██║██╔════╝██║     ██╔════╝
 ██╔████╔██║███████║██╔██╗ ██║███████║██║ █╗ ██║███████║█████╗███████╗███████║█████╗  ██║     █████╗
 ██║╚██╔╝██║██╔══██║██║╚██╗██║██╔══██║██║███╗██║██╔══██║╚════╝╚════██║██╔══██║██╔══╝  ██║     ██╔══╝
 ██║ ╚═╝ ██║██║  ██║██║ ╚████║██║  ██║╚███╔███╔╝██║  ██║      ███████║██║  ██║███████╗███████╗██║
 ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═╝  ╚═╝      ╚══════╝╚═╝  ╚═╝╚══════╝╚══════╝╚═╝`}
          </pre>
          <div className="mb-3 text-base font-bold md:hidden">
            {">"} MANHWA-SHELF v2.0
          </div>

          {/* Stats banner */}
          <div className="border border-terminal-border/60 bg-terminal-cyan/[0.03] px-3 py-2 text-xs text-terminal-cyan md:px-5 md:py-3 md:text-sm">
            <span className="text-terminal-dim">{"["}</span>
            <span className="text-terminal-green">SYS</span>
            <span className="text-terminal-dim">{"]"}</span> TOTAL:{" "}
            <span className="text-white">{totalTitles}</span> TITLES{" "}
            <span className="text-terminal-muted">|</span>{" "}
            <span className="text-white">{totalChapters.toLocaleString()}</span>{" "}
            CHS <span className="text-terminal-muted">|</span>{" "}
            <span className="text-white">{totalSizeGB.toFixed(1)}</span> GB
            <span className="blink-cursor text-terminal-green">_</span>
          </div>
        </div>

        {/* Boot sequence text */}
        <div className="mb-4 text-xs text-terminal-muted">
          <div>{">"} initializing download manager...</div>
          <div>{">"} scanning local archive...</div>
          <div>
            {">"} found {totalTitles} titles ({totalChapters.toLocaleString()}{" "}
            chapters indexed)
          </div>
          <div className="text-terminal-green">{">"} ready.</div>
        </div>

        {/* Table */}
        <Table className="text-[0.8rem] [&_tr]:border-terminal-border/40">
          <TableHeader>
            <TableRow className="border-terminal-border hover:bg-transparent">
              <TableHead className="text-[0.7rem] font-bold tracking-widest text-terminal-cyan">
                STATUS{" "}
                <span className="text-[0.6rem] text-terminal-muted">
                  {"▲▼"}
                </span>
              </TableHead>
              <TableHead className="text-[0.7rem] font-bold tracking-widest text-terminal-cyan">
                TITLE{" "}
                <span className="text-[0.6rem] text-terminal-muted">
                  {"▲▼"}
                </span>
              </TableHead>
              <TableHead className="hidden text-[0.7rem] font-bold tracking-widest text-terminal-cyan md:table-cell">
                AUTHOR{" "}
                <span className="text-[0.6rem] text-terminal-muted">
                  {"▲▼"}
                </span>
              </TableHead>
              <TableHead className="text-[0.7rem] font-bold tracking-widest text-terminal-cyan">
                PROGRESS{" "}
                <span className="text-[0.6rem] text-terminal-muted">
                  {"▲▼"}
                </span>
              </TableHead>
              <TableHead className="text-[0.7rem] font-bold tracking-widest text-terminal-cyan">
                CHS{" "}
                <span className="text-[0.6rem] text-terminal-muted">
                  {"▲▼"}
                </span>
              </TableHead>
              <TableHead className="text-[0.7rem] font-bold tracking-widest text-terminal-cyan">
                SIZE{" "}
                <span className="text-[0.6rem] text-terminal-muted">
                  {"▲▼"}
                </span>
              </TableHead>
              <TableHead className="hidden text-[0.7rem] font-bold tracking-widest text-terminal-cyan md:table-cell">
                LAST SYNC{" "}
                <span className="text-[0.6rem] text-terminal-muted">
                  {"▲▼"}
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sampleManga.map((manga) => {
              const status = getDownloadStatus(manga);
              const config = statusConfig[status];
              const isPartial = status === "partial";
              const chaptersStr = manga.chapters.total
                ? `${manga.chapters.downloaded}/${manga.chapters.total}`
                : `${manga.chapters.downloaded}/?`;

              return (
                <TableRow
                  key={manga.id}
                  className="border-terminal-border/20 transition-colors hover:bg-terminal-row-hover"
                >
                  {/* STATUS */}
                  <TableCell>
                    <StatusBadge status={status} />
                  </TableCell>

                  {/* TITLE with cover image */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {/* Cover thumbnail */}
                      <div
                        className={`relative h-[38px] w-[28px] shrink-0 overflow-hidden border ${config.borderClass} bg-terminal-bg`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={manga.coverImage}
                          alt={manga.title}
                          className={`h-full w-full object-cover contrast-[1.2] saturate-[0.6] ${
                            status === "not-downloaded"
                              ? "opacity-30"
                              : "opacity-85"
                          }`}
                        />
                        {/* Scanline overlay on thumbnail */}
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
                        <span className={config.textClass}>{manga.title}</span>
                        {isPartial && (
                          <span className="blink-cursor text-terminal-cyan">
                            _
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* AUTHOR */}
                  <TableCell className="hidden text-terminal-dim md:table-cell">
                    {manga.author}
                  </TableCell>

                  {/* PROGRESS */}
                  <TableCell>
                    <ProgressDisplay manga={manga} />
                  </TableCell>

                  {/* CHAPTERS */}
                  <TableCell className="tabular-nums text-[#888]">
                    {chaptersStr}
                  </TableCell>

                  {/* SIZE */}
                  <TableCell
                    className={
                      manga.sizeOnDisk === "0 MB"
                        ? "text-terminal-muted"
                        : "text-terminal-cyan"
                    }
                  >
                    {manga.sizeOnDisk}
                  </TableCell>

                  {/* LAST SYNC */}
                  <TableCell className="hidden text-[#444] md:table-cell">
                    {manga.lastUpdated || "--"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* Footer */}
        <div className="mt-6 border-t border-terminal-border pt-4 text-xs text-terminal-muted">
          <div className="flex flex-col gap-1 md:flex-row md:justify-between">
            <span>
              <span className="text-terminal-dim">{"["}</span>
              <span className="text-terminal-green">OK</span>
              <span className="text-terminal-dim">{"]"}</span> manhwa-shelf
              daemon running on port 9090
            </span>
            <span>
              session: 0x4f2a
              <span className="text-terminal-muted"> | </span>
              uptime: 14d 7h 23m
              <span className="text-terminal-muted"> | </span>
              <span className="text-terminal-green">
                connected
                <span className="blink-cursor">_</span>
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
