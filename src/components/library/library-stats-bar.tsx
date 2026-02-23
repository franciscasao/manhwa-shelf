interface LibraryStatsBarProps {
  totalTitles: number;
  totalChapters: number;
  totalSizeGB: number;
  completeCount: number;
  partialCount: number;
  noneCount: number;
  isHydrated: boolean;
}

export function LibraryStatsBar({
  totalTitles,
  totalChapters,
  totalSizeGB,
  completeCount,
  partialCount,
  noneCount,
  isHydrated,
}: LibraryStatsBarProps) {
  return (
    <div className="mb-6 border-b border-terminal-border pb-4">
      {/* ASCII header — desktop */}
      <pre className="mb-4 hidden select-none text-[0.65rem] leading-tight text-terminal-green md:block">
        {`LIBRARY ░░ LOCAL ARCHIVE ░░ FILE MANAGER`}
      </pre>

      {/* Mobile fallback */}
      <div className="mb-3 text-base font-bold md:hidden">
        {">"} LIBRARY // FILE MANAGER
      </div>

      {/* Stats banner */}
      <div className="border border-terminal-border/60 bg-terminal-cyan/[0.03] px-3 py-2 text-xs text-terminal-cyan md:px-5 md:py-3 md:text-sm">
        <span className="text-terminal-dim">{"["}</span>
        <span className="text-terminal-green">SYS</span>
        <span className="text-terminal-dim">{"]"}</span>{" "}
        TITLES: <span className="text-white">{isHydrated ? totalTitles : "—"}</span>
        <span className="text-terminal-muted"> | </span>
        CHS: <span className="text-white">{isHydrated ? totalChapters.toLocaleString() : "—"}</span>
        <span className="text-terminal-muted"> | </span>
        DISK: <span className="text-white">{isHydrated ? totalSizeGB.toFixed(1) : "—"}</span> GB
        <span className="text-terminal-muted"> | </span>
        <span className="text-terminal-green">DONE</span>: <span className="text-white">{isHydrated ? completeCount : "—"}</span>
        <span className="text-terminal-muted"> </span>
        <span className="text-terminal-cyan">SYNC</span>: <span className="text-white">{isHydrated ? partialCount : "—"}</span>
        <span className="text-terminal-muted"> </span>
        <span className="text-terminal-dim">NONE</span>: <span className="text-white">{isHydrated ? noneCount : "—"}</span>
        <span className="blink-cursor text-terminal-green">_</span>
      </div>
    </div>
  );
}
