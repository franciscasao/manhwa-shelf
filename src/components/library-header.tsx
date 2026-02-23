interface LibraryHeaderProps {
  totalTitles: number;
  totalChapters: number;
  totalSizeGB: number;
}

export function LibraryHeader({
  totalTitles,
  totalChapters,
  totalSizeGB,
}: LibraryHeaderProps) {
  return (
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
        <span className="text-white">{totalChapters.toLocaleString()}</span> CHS{" "}
        <span className="text-terminal-muted">|</span>{" "}
        <span className="text-white">{totalSizeGB.toFixed(1)}</span> GB
        <span className="blink-cursor text-terminal-green">_</span>
      </div>
    </div>
  );
}
