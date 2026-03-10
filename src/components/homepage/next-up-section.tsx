"use client";

import Link from "next/link";
import { useNextUp } from "@/hooks/use-reading-history";
import { useAuth } from "@/hooks/use-auth";

export function NextUpSection() {
  const { user } = useAuth();
  const { items, isLoading } = useNextUp(8);

  if (!user) return null;
  if (!isLoading && items.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="text-[0.6rem] text-terminal-muted tracking-widest mb-3 border-b border-terminal-border pb-2">
        --- NEXT UP ---
        {!isLoading && items.length > 0 && <span> {items.length} queued</span>}
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
            const anilistId = parseInt(item.mangaId, 10);
            const readUrl = `/manhwa/${anilistId}/read/${item.nextChapterNum}`;
            const detailUrl = `/manhwa/${anilistId}`;

            return (
              <div
                key={item.mangaId}
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
                  {/* Chapter badge */}
                  <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1 bg-terminal-bg/80 text-[0.5rem] text-terminal-cyan font-mono">
                    CH {item.nextChapterNum}
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

                  <div className="text-[0.5rem] text-terminal-dim font-mono">
                    completed ch {item.lastCompletedChapter}
                  </div>

                  {/* Read button */}
                  <Link
                    href={readUrl}
                    className="block text-center text-[0.55rem] font-mono border border-terminal-green/40 text-terminal-green py-0.5 hover:bg-terminal-green/10 transition-colors"
                  >
                    [ READ NEXT ]
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
