import Link from "next/link";

interface ReaderToolbarProps {
  anilistId: number;
  episodeTitle: string;
  chapterNum: number;
  prevChapter: number | null;
  nextChapter: number | null;
  progress: number;
  visible: boolean;
}

export function ReaderToolbar({
  anilistId,
  episodeTitle,
  chapterNum,
  prevChapter,
  nextChapter,
  progress,
  visible,
}: ReaderToolbarProps) {
  return (
    <div
      className={`fixed top-0 left-0 right-0 z-40 transition-transform duration-300 ${
        visible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="bg-terminal-bg/90 backdrop-blur-sm border-b border-terminal-border/40">
        <div className="mx-auto max-w-[900px] px-3 py-2 flex items-center justify-between text-xs">
          {/* Left: back + title */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={`/manhwa/${anilistId}`}
              className="shrink-0 text-terminal-dim hover:text-terminal-cyan transition-colors"
            >
              [ &lt; BACK ]
            </Link>
            <span className="text-terminal-green truncate">
              Ch.{String(chapterNum).padStart(3, "0")} — {episodeTitle}
            </span>
          </div>

          {/* Right: prev/next */}
          <div className="flex items-center gap-2 shrink-0">
            {prevChapter !== null ? (
              <Link
                href={`/manhwa/${anilistId}/read/${prevChapter}`}
                className="text-terminal-cyan hover:text-terminal-green transition-colors"
              >
                [ &lt; PREV ]
              </Link>
            ) : (
              <span className="text-terminal-dim">[ &lt; PREV ]</span>
            )}
            {nextChapter !== null ? (
              <Link
                href={`/manhwa/${anilistId}/read/${nextChapter}`}
                className="text-terminal-cyan hover:text-terminal-green transition-colors"
              >
                [ NEXT &gt; ]
              </Link>
            ) : (
              <span className="text-terminal-dim">[ NEXT &gt; ]</span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-[2px] bg-terminal-border/20">
          <div
            className="h-full bg-terminal-green transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
