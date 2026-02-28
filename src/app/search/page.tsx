"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { mapAniListToManga } from "@/lib/anilist";
import { useShelf } from "@/hooks/use-shelf";
import { useSearchMedia } from "@/hooks/use-search-media";
import { Plus, Check } from "lucide-react";
import { MangaTerminalCard } from "@/components/manga-terminal-card";
import { TerminalPagination } from "@/components/terminal-pagination";
import { SearchOrigin } from "@/lib/types";

const ORIGIN_OPTIONS: Array<{
  value: SearchOrigin;
  flag: string;
  label: string;
}> = [
  { value: "ALL", flag: "--all", label: "MANGA/MANHWA/MANHUA" },
  { value: "KR", flag: "--manhwa (KR)", label: "MANHWA" },
  { value: "JP", flag: "--manga (JP)", label: "MANGA" },
  { value: "CN", flag: "--manhua (CN)", label: "MANHUA" },
  { value: "TW", flag: "--manhua (TW)", label: "MANHUA" },
];

const VALID_ORIGINS: SearchOrigin[] = ORIGIN_OPTIONS.map((o) => o.value);

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="font-mono min-h-screen bg-terminal-bg text-terminal-green px-3 py-10 text-xs">
          {">"} initializing search interface
          <span className="blink-cursor">_</span>
        </div>
      }
    >
      <SearchPageInner />
    </Suspense>
  );
}

function SearchPageInner() {
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [origin, setOrigin] = useState<SearchOrigin>(() => {
    const param = searchParams.get("origin");
    return param && VALID_ORIGINS.includes(param as SearchOrigin)
      ? (param as SearchOrigin)
      : "KR";
  });
  const [currentPage, setCurrentPage] = useState(() => {
    const param = searchParams.get("page");
    const n = param ? parseInt(param, 10) : 1;
    return n >= 1 ? n : 1;
  });
  const [showAdult, setShowAdult] = useState(
    () => searchParams.get("nsfw") === "1",
  );
  const { addToShelf, isOnShelf } = useShelf();

  const inputRef = useRef<HTMLInputElement>(null);
  const sessionStartRef = useRef(
    new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
  );

  const { results, pageInfo, isLoading, error, hasSearched, queryMs } =
    useSearchMedia(query, origin, currentPage, showAdult);

  const originLabel =
    ORIGIN_OPTIONS.find((o) => o.value === origin)?.label ?? origin;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Sync state → URL query params (replaceState avoids history pollution)
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (origin !== "KR") params.set("origin", origin);
    if (currentPage > 1) params.set("page", String(currentPage));
    if (showAdult) params.set("nsfw", "1");
    const qs = params.toString();
    const url = qs
      ? `${window.location.pathname}?${qs}`
      : window.location.pathname;
    window.history.replaceState(null, "", url);
  }, [query, origin, currentPage, showAdult]);

  // Reset to page 1 when query or origin changes
  const handleQueryChange = (value: string) => {
    setQuery(value);
    setCurrentPage(1);
  };

  const handleOriginChange = (value: SearchOrigin) => {
    setOrigin(value);
    setCurrentPage(1);
  };

  const handleToggleAdult = () => {
    setShowAdult((prev) => !prev);
    setCurrentPage(1);
  };

  return (
    <div className="font-mono relative min-h-screen bg-terminal-bg text-terminal-green overflow-hidden">
      {/* CRT scanline overlay */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-50"
        style={{
          background:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 3px)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1200px] animate-[flicker_4s_infinite] px-3 py-6 md:px-8 md:py-10">
        {/* SECTION 1: Terminal system header */}
        <div className="mb-6 border-b border-terminal-border pb-4">
          <div className="mb-1 text-xs text-terminal-muted">
            {originLabel}-DB v2.0 -- AniList Query Interface
          </div>
          <div className="mb-3 text-xs text-terminal-dim">
            session: {sessionStartRef.current}
            <span className="mx-2 text-terminal-muted">|</span>
            endpoint: api.anilist.co/v2
            <span className="mx-2 text-terminal-muted">|</span>
            <span className="text-terminal-green">
              connected<span className="blink-cursor">_</span>
            </span>
          </div>
          <div className="border border-terminal-border/60 bg-terminal-cyan/[0.03] px-3 py-2 text-xs text-terminal-cyan md:px-5 md:py-3 md:text-sm">
            <span className="text-terminal-dim">[</span>
            <span className="text-terminal-green">DB</span>
            <span className="text-terminal-dim">]</span> {originLabel}-SHELF
            ARCHIVE
            <span className="text-terminal-muted"> | </span>SOURCE: ANILIST
            <span className="text-terminal-muted"> | </span>COUNTRY: {origin}
            <span className="text-terminal-muted"> | </span>FORMAT: MANGA
            <span className="blink-cursor text-terminal-green">_</span>
          </div>
        </div>

        {/* SECTION 1.5: Origin toggle */}
        <div className="mb-4 flex items-center gap-2">
          <span className="text-[0.65rem] text-terminal-muted tracking-widest mr-1">
            MODE:
          </span>
          {ORIGIN_OPTIONS.map(({ value, flag }) => (
            <button
              key={value}
              onClick={() => handleOriginChange(value)}
              className={`border px-3 py-1 text-xs font-mono transition-colors ${
                origin === value
                  ? "border-terminal-cyan bg-terminal-cyan/10 text-terminal-cyan"
                  : "border-terminal-border text-terminal-dim hover:text-terminal-muted"
              }`}
            >
              {flag}
            </button>
          ))}
          <span className="mx-1 text-terminal-border">|</span>
          <button
            onClick={handleToggleAdult}
            className={`border px-3 py-1 text-xs font-mono transition-colors ${
              showAdult
                ? "border-terminal-orange bg-terminal-orange/10 text-terminal-orange"
                : "border-terminal-border text-terminal-dim hover:text-terminal-muted"
            }`}
          >
            --nsfw
          </button>
        </div>

        {/* SECTION 2: Query prompt */}
        <div className="mb-2">
          <div className="text-[0.65rem] text-terminal-muted mb-1 tracking-widest">
            ENTER SEARCH QUERY
          </div>
          <div
            className={`flex items-center border px-3 py-2 md:px-4 md:py-3 transition-colors ${
              query.length > 0
                ? "border-terminal-cyan query-input-active"
                : "border-terminal-border"
            }`}
          >
            <span className="mr-2 select-none font-bold text-terminal-cyan text-sm md:text-base shrink-0">
              {">"} QUERY://
            </span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="type title to search anilist..."
              className="flex-1 bg-transparent outline-none border-none text-terminal-green placeholder:text-terminal-muted font-mono text-sm md:text-base"
              style={{ caretColor: "#00d4ff" }}
              autoComplete="off"
              spellCheck={false}
            />
            <span className="ml-2 shrink-0 text-[0.65rem] text-terminal-dim tabular-nums">
              {isLoading ? (
                <span className="text-terminal-orange animate-pulse">
                  QUERYING...
                </span>
              ) : query.length > 0 ? (
                <span>{query.length} chars</span>
              ) : null}
            </span>
          </div>
          <div className="mt-1 text-[0.6rem] text-terminal-muted">
            {"// min 2 chars to execute query -- results stream automatically"}
          </div>
        </div>

        {/* SECTION 3: Loading state */}
        {isLoading && (
          <div className="mt-6">
            <div className="text-xs text-terminal-dim mb-3 font-mono space-y-0.5">
              <div>
                {">"} executing query:{" "}
                <span className="text-terminal-cyan">&quot;{query}&quot;</span>
              </div>
              <div>{">"} connecting to anilist graphql endpoint...</div>
              <div>
                {">"} filtering:{" "}
                {origin === "ALL"
                  ? "countryOfOrigin=*, "
                  : `countryOfOrigin=${origin}, `}
                format=MANGA
              </div>
              <div className="text-terminal-orange">
                {">"} fetching results<span className="blink-cursor">_</span>
              </div>
            </div>
            <div className="space-y-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 border border-terminal-border/30 px-3 py-2"
                  style={{ opacity: 1 - i * 0.1 }}
                >
                  <div className="h-[38px] w-[28px] shrink-0 bg-terminal-border/30 animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div
                      className="h-2 bg-terminal-border/40 animate-pulse"
                      style={{ width: `${60 + (i % 3) * 15}%` }}
                    />
                    <div
                      className="h-1.5 bg-terminal-border/20 animate-pulse"
                      style={{ width: `${30 + (i % 4) * 10}%` }}
                    />
                  </div>
                  <div className="text-[0.6rem] text-terminal-muted shrink-0">
                    loading...
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 4: Error / no results / idle states */}
        {error && !isLoading && (
          <div className="mt-6 border border-terminal-orange/40 bg-terminal-orange/[0.03] px-3 py-3 text-xs font-mono space-y-0.5">
            <div className="text-terminal-orange">{">"} QUERY ERROR</div>
            <div className="text-terminal-orange/70">
              {">"} ERR: {error}
            </div>
            <div className="text-terminal-muted">
              {">"} check connection and retry
            </div>
          </div>
        )}
        {!isLoading && !error && hasSearched && results.length === 0 && (
          <div className="mt-6 text-xs font-mono text-terminal-muted space-y-0.5">
            <div>
              {">"} query:{" "}
              <span className="text-terminal-cyan">&quot;{query}&quot;</span>
            </div>
            <div>
              {">"} results: <span className="text-terminal-orange">0</span>
            </div>
            <div>
              {">"} no matching titles in anilist {originLabel.toLowerCase()}{" "}
              archive
            </div>
          </div>
        )}
        {!isLoading && !error && !hasSearched && (
          <div className="mt-6 text-xs font-mono text-terminal-muted space-y-0.5">
            <div>{">"} awaiting query input...</div>
            <div>
              {">"} ready
              <span className="blink-cursor text-terminal-green">_</span>
            </div>
          </div>
        )}

        {/* SECTION 5: Results grid with stagger animation */}
        {!isLoading && !error && results.length > 0 && (
          <div className="mt-6">
            <div className="mb-3 text-[0.65rem] font-mono text-terminal-dim border-b border-terminal-border pb-2">
              <span className="text-terminal-green">{">"}</span> query complete
              <span className="text-terminal-muted mx-2">|</span>
              <span className="text-white">{results.length}</span> records
              returned
              {pageInfo && (
                <>
                  <span className="text-terminal-muted mx-2">|</span>
                  page{" "}
                  <span className="text-white">{pageInfo.currentPage}</span>
                </>
              )}
              {queryMs !== null && (
                <>
                  <span className="text-terminal-muted mx-2">|</span>
                  {queryMs}ms
                </>
              )}
              <span className="text-terminal-muted mx-2">|</span>
              sorted: SEARCH_MATCH
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {results.map((media, index) => {
                const manga = mapAniListToManga(
                  media,
                  origin === "ALL" ? undefined : origin,
                );
                const onShelf = isOnShelf(manga.id);

                return (
                  <MangaTerminalCard
                    key={manga.id}
                    manga={manga}
                    index={index}
                    accentColor={onShelf ? "bg-terminal-green" : undefined}
                    titleClass={onShelf ? "text-terminal-green" : undefined}
                    showGhost={false}
                    action={
                      <button
                        onClick={() => !onShelf && addToShelf(manga)}
                        disabled={onShelf}
                        className={`absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1.5 border-t border-terminal-border/40 bg-terminal-bg/95 py-1.5 text-xs font-mono transition-opacity ${
                          onShelf
                            ? "text-terminal-green opacity-100"
                            : "text-terminal-cyan opacity-0 group-hover:opacity-100 hover:text-terminal-green cursor-pointer"
                        }`}
                      >
                        {onShelf ? (
                          <>
                            <Check className="h-3 w-3" />[ ON SHELF ]
                          </>
                        ) : (
                          <>
                            <Plus className="h-3 w-3" />[ ADD ]
                          </>
                        )}
                      </button>
                    }
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION 5.5: Pagination controls */}
        {!isLoading && !error && results.length > 0 && (
          <TerminalPagination
            currentPage={currentPage}
            hasNextPage={pageInfo?.hasNextPage ?? false}
            onPageChange={setCurrentPage}
          />
        )}

        {/* SECTION 6: Status bar */}
        <div className="mt-8 border-t border-terminal-border pt-3 text-[0.6rem] font-mono text-terminal-muted">
          <div className="flex flex-col gap-1 md:flex-row md:justify-between">
            <span>
              <span className="text-terminal-dim">[</span>
              <span className="text-terminal-green">DB</span>
              <span className="text-terminal-dim">]</span> anilist-proxy active
              <span className="mx-2">|</span>
              source: api.anilist.co
              <span className="mx-2">|</span>
              {hasSearched ? (
                <span className="text-terminal-green">
                  {results.length} records in view
                </span>
              ) : (
                <span>no query executed</span>
              )}
            </span>
            <span>
              {isLoading && (
                <span className="text-terminal-orange animate-pulse">
                  executing...
                </span>
              )}
              {!isLoading && hasSearched && queryMs !== null && (
                <span>last query: {queryMs}ms</span>
              )}
              {!isLoading && !hasSearched && (
                <span>
                  status: idle
                  <span className="blink-cursor text-terminal-green">_</span>
                </span>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
