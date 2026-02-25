"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toPocketBaseId } from "@/lib/manga-utils";
import { useChapterReader } from "@/hooks/use-chapter-reader";
import { ReaderToolbar } from "@/components/reader/reader-toolbar";
import { ReaderImageStrip } from "@/components/reader/reader-image-strip";
import { ReaderBottomNav } from "@/components/reader/reader-bottom-nav";

export default function ChapterReaderPage() {
  const params = useParams();
  const router = useRouter();
  const anilistId = Number(params.id);
  const chapterNum = Number(params.chapter);
  const mangaId = toPocketBaseId(anilistId);

  const { chapter, isLoading, error } = useChapterReader(mangaId, chapterNum);

  const [toolbarVisible, setToolbarVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const lastScrollY = useRef(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(null);

  // Auto-hide toolbar after initial delay
  useEffect(() => {
    hideTimer.current = setTimeout(() => setToolbarVisible(false), 3000);
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [chapterNum]);

  // Show/hide toolbar on scroll direction
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY < lastScrollY.current - 10) {
        setToolbarVisible(true);
      } else if (currentY > lastScrollY.current + 10) {
        setToolbarVisible(false);
      }
      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll to top on chapter change
  useEffect(() => {
    window.scrollTo({ top: 0 });
    setProgress(0);
    setToolbarVisible(true);
  }, [chapterNum]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        router.push(`/manhwa/${anilistId}`);
      } else if (e.key === "ArrowLeft" && chapter?.prevChapter !== null && chapter?.prevChapter !== undefined) {
        router.push(`/manhwa/${anilistId}/read/${chapter.prevChapter}`);
      } else if (e.key === "ArrowRight" && chapter?.nextChapter !== null && chapter?.nextChapter !== undefined) {
        router.push(`/manhwa/${anilistId}/read/${chapter.nextChapter}`);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, anilistId, chapter?.prevChapter, chapter?.nextChapter]);

  const handleProgressChange = useCallback((p: number) => {
    setProgress(p);
  }, []);

  const handleTap = useCallback(() => {
    setToolbarVisible((v) => !v);
  }, []);

  const bootLines = useRef([
    "> initializing chapter reader...",
    "> connecting to pocketbase...",
    `> loading chapter ${String(chapterNum).padStart(3, "0")}`,
    "> resolving image data...",
  ]);

  return (
    <div className="font-mono min-h-screen bg-terminal-bg text-terminal-green">
      {/* Loading state */}
      {isLoading && (
        <div className="relative z-10 mx-auto max-w-[900px] px-3 py-10">
          <div className="text-xs font-mono space-y-1">
            {bootLines.current.map((line, i) => (
              <div
                key={i}
                className="text-terminal-dim detail-section"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                {line}
              </div>
            ))}
            <div
              className="text-terminal-orange detail-section"
              style={{ animationDelay: `${bootLines.current.length * 150}ms` }}
            >
              {">"} loading<span className="blink-cursor">_</span>
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="relative z-10 mx-auto max-w-[900px] px-3 py-10">
          <div className="border border-terminal-orange/40 bg-terminal-orange/[0.03] px-3 py-3 text-xs font-mono space-y-0.5">
            <div className="text-terminal-orange">{">"} READER ERROR</div>
            <div className="text-terminal-orange/70">{">"} ERR: {error}</div>
            <div className="text-terminal-muted">
              {">"} chapter may not be downloaded yet
            </div>
          </div>
          <button
            onClick={() => router.push(`/manhwa/${anilistId}`)}
            className="mt-4 text-xs text-terminal-dim hover:text-terminal-cyan transition-colors"
          >
            [ &lt; BACK TO DIRECTORY ]
          </button>
        </div>
      )}

      {/* Reader content */}
      {chapter && !isLoading && (
        <>
          <ReaderToolbar
            anilistId={anilistId}
            episodeTitle={chapter.episodeTitle}
            chapterNum={chapter.chapterNum}
            prevChapter={chapter.prevChapter}
            nextChapter={chapter.nextChapter}
            progress={progress}
            visible={toolbarVisible}
          />

          <div className="relative z-10 pt-2">
            <ReaderImageStrip
              imageUrls={chapter.imageUrls}
              onProgressChange={handleProgressChange}
              onTap={handleTap}
            />

            <div className="mx-auto max-w-[800px] mt-4 mb-8 px-3">
              <ReaderBottomNav
                anilistId={anilistId}
                chapterNum={chapter.chapterNum}
                prevChapter={chapter.prevChapter}
                nextChapter={chapter.nextChapter}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
