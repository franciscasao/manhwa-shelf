"use client";

import Link from "next/link";
import { useContinueReading } from "@/hooks/use-reading-history";
import { useAuth } from "@/hooks/use-auth";

function formatTimeAgo(updatedAt: string): string {
  const diff = Date.now() - new Date(updatedAt).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ContinueReadingSection() {
  const { user } = useAuth();
  const { items, isLoading } = useContinueReading(8);

  // Don't render for unauthenticated users
  if (!user) return null;

  // Don't render the section at all if there's nothing to show (and not loading)
  if (!isLoading && items.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="text-[0.6rem] text-terminal-muted tracking-widest mb-3 border-b border-terminal-border pb-2">
        --- CONTINUE READING ---
        {!isLoading && items.length > 0 && <span> {items.length} in progress</span>}
      </div>

      {isLoading && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[140px] border border-terminal-border/30 animate-pulse"
              style={{ opacity: 1 - i * 0.15 }}
            >
              <div className="aspect-[3/4] bg-terminal-border/20" />
              <div className="p-2 space-y-1.5">
                <div className="h-2 bg-terminal-border/30 w-4/5" />
                <div className="h-1.5 bg-terminal-border/20 w-3/5" />
                <div className="h-1 bg-terminal-border/10 w-full mt-1" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {items.map((item, index) => {
            // mangaId is 15-char zero-padded AniList ID → parse back to int
            const anilistId = parseInt(item.mangaId, 10);
            const readUrl = `/manhwa/${anilistId}/read/${item.chapterNum}`;
            const detailUrl = `/manhwa/${anilistId}`;
            const pct = item.totalPages > 0 ? Math.round((item.pageIndex / Math.max(item.totalPages - 1, 1)) * 100) : 0;
            const isFinished = item.completed || item.pageIndex >= item.totalPages - 1;

            return (
              <div
                key={`${item.mangaId}-${item.chapterNum}`}
                className="flex-shrink-0 w-[140px] border border-terminal-border/40 bg-terminal-bg/60 result-enter"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                {/* Cover image */}
                <Link href={detailUrl} className="block relative aspect-[3/4] overflow-hidden">
                  {item.coverImage ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={item.coverImage}
                      alt={item.mangaTitle}
                      className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-terminal-border/10">
                      <span className="text-[0.5rem] text-terminal-dim">NO IMAGE</span>
                    </div>
                  )}
                  {/* Completed badge */}
                  {isFinished && (
                    <div className="absolute top-0 right-0 px-1 py-0.5 bg-terminal-cyan/90 text-terminal-bg text-[0.45rem] font-mono font-bold tracking-wider">
                      DONE
                    </div>
                  )}
                  {/* Chapter badge */}
                  <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1 bg-terminal-bg/80 text-[0.5rem] text-terminal-cyan font-mono">
                    CH {item.chapterNum} · PG {item.pageIndex + 1}/{item.totalPages}
                  </div>
                </Link>

                {/* Info */}
                <div className="p-2 space-y-1.5">
                  <Link href={detailUrl} className="block">
                    <div
                      className="text-[0.6rem] text-terminal-green font-mono leading-tight line-clamp-2 hover:text-terminal-cyan transition-colors"
                      title={item.mangaTitle}
                    >
                      {item.mangaTitle}
                    </div>
                  </Link>

                  <div className="text-[0.5rem] text-terminal-dim font-mono">{formatTimeAgo(item.updatedAt)}</div>

                  {/* Progress bar */}
                  <div className="h-0.5 w-full bg-terminal-border/30">
                    <div
                      className={`h-full transition-all ${isFinished ? "bg-terminal-cyan" : "bg-terminal-green"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {/* Resume button */}
                  <Link
                    href={readUrl}
                    className="block text-center text-[0.55rem] font-mono border border-terminal-cyan/40 text-terminal-cyan py-0.5 hover:bg-terminal-cyan/10 transition-colors"
                  >
                    {isFinished ? "[ RE-READ ]" : "[ RESUME ]"}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
