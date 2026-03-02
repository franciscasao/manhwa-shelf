"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { MangaTerminalCard } from "@/components/manga-terminal-card";
import { TerminalPagination } from "@/components/terminal-pagination";

const PER_PAGE = 20;

export function CatalogGrid() {
  const trpc = useTRPC();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery(
    trpc.catalog.getPublicCatalog.queryOptions({ page, perPage: PER_PAGE }),
  );

  return (
    <section id="catalog">
      {/* Section header */}
      <div className="text-[0.6rem] text-terminal-muted tracking-widest mb-3 border-b border-terminal-border pb-2">
        --- PUBLIC CATALOG ---
        {data && (
          <span>
            {" "}{data.totalItems} titles archived
          </span>
        )}
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="border border-terminal-border/30 animate-pulse"
              style={{ opacity: 1 - i * 0.08 }}
            >
              <div className="aspect-[3/4] bg-terminal-border/20" />
              <div className="p-2 space-y-1.5">
                <div className="h-2 bg-terminal-border/30" style={{ width: `${60 + (i % 3) * 15}%` }} />
                <div className="h-1.5 bg-terminal-border/20" style={{ width: `${30 + (i % 4) * 10}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {data && data.items.length === 0 && (
        <div className="border border-terminal-border/40 px-4 py-8 text-center text-xs text-terminal-dim">
          {">"} no titles in the archive yet
        </div>
      )}

      {/* Grid */}
      {data && data.items.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {data.items.map((manga, index) => (
              <MangaTerminalCard
                key={manga.id}
                manga={manga}
                index={index}
                action={
                  <div className="px-2 pb-2 text-[0.6rem] text-terminal-dim">
                    {manga.chapters.downloaded} ch archived
                  </div>
                }
              />
            ))}
          </div>

          <TerminalPagination
            currentPage={page}
            hasNextPage={page < data.totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </section>
  );
}
