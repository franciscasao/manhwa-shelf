import Link from "next/link";

interface LibraryEmptyStateProps {
  mode: "empty" | "no-matches";
  searchQuery?: string;
  activeFilter?: string;
}

export function LibraryEmptyState({ mode, searchQuery, activeFilter }: LibraryEmptyStateProps) {
  if (mode === "empty") {
    return (
      <div className="mt-8 flex flex-col items-center py-12 text-center">
        <pre className="mb-4 text-xs text-terminal-dim leading-tight select-none">
{`╔══════════════════════════════╗
║                              ║
║      NO FILES FOUND          ║
║                              ║
║   shelf archive is empty.    ║
║   use /search to add         ║
║   titles to your library.    ║
║                              ║
╚══════════════════════════════╝`}
        </pre>
        <Link
          href="/search"
          className="mt-2 border border-terminal-cyan px-4 py-1.5 text-xs font-mono text-terminal-cyan transition-colors hover:bg-terminal-cyan/10"
        >
          {">"} OPEN SEARCH
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col items-center py-12 text-center text-xs font-mono">
      <div className="text-terminal-dim space-y-1">
        <div>{">"} grep: <span className="text-terminal-cyan">&quot;{searchQuery}&quot;</span></div>
        <div>{">"} filter: <span className="text-terminal-cyan">{activeFilter}</span></div>
        <div className="text-terminal-orange mt-2">{">"} 0 results — try adjusting parameters</div>
      </div>
    </div>
  );
}
