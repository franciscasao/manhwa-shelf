interface TerminalPaginationProps {
  currentPage: number;
  hasNextPage: boolean;
  onPageChange: (page: number) => void;
}

export function TerminalPagination({
  currentPage,
  hasNextPage,
  onPageChange,
}: TerminalPaginationProps) {
  if (currentPage <= 1 && !hasNextPage) return null;

  return (
    <div className="mt-4 border border-terminal-border/60 px-3 py-2 flex items-center justify-between text-xs font-mono">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage <= 1}
        className="border border-terminal-border px-2 py-0.5 text-terminal-cyan hover:bg-terminal-cyan/10 transition-colors disabled:text-terminal-muted disabled:border-terminal-border/30 disabled:hover:bg-transparent"
      >
        {"<"} prev
      </button>
      <span className="text-terminal-dim">
        page <span className="text-terminal-cyan">{currentPage}</span>
      </span>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNextPage}
        className="border border-terminal-border px-2 py-0.5 text-terminal-cyan hover:bg-terminal-cyan/10 transition-colors disabled:text-terminal-muted disabled:border-terminal-border/30 disabled:hover:bg-transparent"
      >
        next {">"}
      </button>
    </div>
  );
}
