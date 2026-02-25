import Link from "next/link";

interface ReaderBottomNavProps {
  anilistId: number;
  chapterNum: number;
  prevChapter: number | null;
  nextChapter: number | null;
}

export function ReaderBottomNav({
  anilistId,
  chapterNum,
  prevChapter,
  nextChapter,
}: ReaderBottomNavProps) {
  return (
    <div className="border border-terminal-border/40 bg-terminal-bg/80 px-4 py-6 text-center space-y-4">
      <div className="text-xs text-terminal-green">
        {">"} CHAPTER {String(chapterNum).padStart(3, "0")} COMPLETE
      </div>

      <div className="flex items-center justify-center gap-4 text-xs">
        {prevChapter !== null ? (
          <Link
            href={`/manhwa/${anilistId}/read/${prevChapter}`}
            className="text-terminal-cyan hover:text-terminal-green transition-colors"
          >
            [ &lt; PREV CHAPTER ]
          </Link>
        ) : (
          <span className="text-terminal-dim cursor-not-allowed">
            [ &lt; PREV CHAPTER ]
          </span>
        )}

        {nextChapter !== null ? (
          <Link
            href={`/manhwa/${anilistId}/read/${nextChapter}`}
            className="text-terminal-cyan hover:text-terminal-green transition-colors"
          >
            [ NEXT CHAPTER &gt; ]
          </Link>
        ) : (
          <span className="text-terminal-dim cursor-not-allowed">
            [ NEXT CHAPTER &gt; ]
          </span>
        )}
      </div>

      <div>
        <Link
          href={`/manhwa/${anilistId}`}
          className="text-[0.65rem] text-terminal-dim hover:text-terminal-cyan transition-colors"
        >
          [ BACK TO DIRECTORY ]
        </Link>
      </div>
    </div>
  );
}
