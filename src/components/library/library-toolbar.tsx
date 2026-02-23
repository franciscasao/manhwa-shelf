import { Search, X, LayoutGrid, List } from "lucide-react";

type FilterValue = "all" | "complete" | "partial" | "not-downloaded";
type SortValue = "title" | "rating" | "chapters" | "size" | "updated";
type ViewMode = "grid" | "list";

interface FilterOption {
  value: FilterValue;
  flag: string;
  count: number;
}

interface LibraryToolbarProps {
  activeFilter: FilterValue;
  onFilterChange: (f: FilterValue) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortBy: SortValue;
  onSortChange: (s: SortValue) => void;
  viewMode: ViewMode;
  onViewModeChange: (v: ViewMode) => void;
  counts: { all: number; complete: number; partial: number; none: number };
}

export function LibraryToolbar({
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  counts,
}: LibraryToolbarProps) {
  const filters: FilterOption[] = [
    { value: "all", flag: "--all", count: counts.all },
    { value: "complete", flag: "--complete", count: counts.complete },
    { value: "partial", flag: "--partial", count: counts.partial },
    { value: "not-downloaded", flag: "--none", count: counts.none },
  ];

  return (
    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      {/* Filter flags */}
      <div className="flex flex-wrap gap-1.5">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => onFilterChange(f.value)}
            className={`border px-2 py-0.5 text-xs font-mono transition-colors ${
              activeFilter === f.value
                ? "border-terminal-cyan bg-terminal-cyan/10 text-terminal-cyan"
                : "border-terminal-border text-terminal-dim hover:border-terminal-dim hover:text-terminal-muted"
            }`}
          >
            {f.flag}{" "}
            <span className="text-terminal-muted">({f.count})</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Search input */}
        <div className="relative flex items-center">
          <Search className="absolute left-2 h-3 w-3 text-terminal-dim" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="grep titles..."
            className="h-7 w-44 border border-terminal-border bg-transparent pl-7 pr-7 text-xs text-terminal-green placeholder:text-terminal-muted font-mono outline-none focus:border-terminal-cyan"
            style={{ caretColor: "#00d4ff" }}
            autoComplete="off"
            spellCheck={false}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-1.5 text-terminal-dim hover:text-terminal-orange"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Sort select */}
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortValue)}
          className="h-7 border border-terminal-border bg-terminal-bg px-2 text-xs font-mono text-terminal-dim outline-none focus:border-terminal-cyan"
        >
          <option value="title">--title</option>
          <option value="rating">--rating</option>
          <option value="chapters">--chapters</option>
          <option value="size">--size</option>
          <option value="updated">--updated</option>
        </select>

        {/* View toggle */}
        <div className="flex border border-terminal-border">
          <button
            onClick={() => onViewModeChange("grid")}
            className={`p-1 transition-colors ${
              viewMode === "grid"
                ? "bg-terminal-cyan/15 text-terminal-cyan"
                : "text-terminal-dim hover:text-terminal-muted"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => onViewModeChange("list")}
            className={`p-1 transition-colors ${
              viewMode === "list"
                ? "bg-terminal-cyan/15 text-terminal-cyan"
                : "text-terminal-dim hover:text-terminal-muted"
            }`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
