"use client";

import { useEffect, useRef, useCallback, useState } from "react";

const PRELOAD_AHEAD = 5;
const BATCH_SIZE = 5;
const MAX_RETRIES = 3;
// Known image dimensions for manhwa pages — used for placeholder sizing
const EXPECTED_ASPECT_RATIO = "2 / 3"; // 800x1200
// Start loading images ~5 pages before they enter the viewport.
// Each placeholder is ~1200px tall (800px × 2/3 aspect ratio), so we need
// a margin large enough to cover PRELOAD_AHEAD pages worth of placeholders.
const OBSERVER_ROOT_MARGIN = "6000px 0px";

type ImageState = "pending" | "loading" | "loaded" | "error";

interface ImageEntry {
  state: ImageState;
  retries: number;
  naturalWidth?: number;
  naturalHeight?: number;
}

interface ReaderImageStripProps {
  imageUrls: string[];
  onProgressChange: (progress: number, pageIndex: number) => void;
  onTap: () => void;
  resumePageIndex?: number;
  onAllPagesVisible?: (visible: boolean) => void;
}

export function ReaderImageStrip({
  imageUrls,
  onProgressChange,
  onTap,
  resumePageIndex = 0,
  onAllPagesVisible,
}: ReaderImageStripProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const maxVisibleRef = useRef(resumePageIndex);
  const hasScrolledToResume = useRef(false);

  // Lazy loading: only render pages up to visibleEnd.
  // Pages before resume are already read; load BATCH_SIZE pages after resume.
  const [visibleEnd, setVisibleEnd] = useState(() =>
    Math.min(imageUrls.length, resumePageIndex + BATCH_SIZE),
  );
  const allPagesVisible = visibleEnd >= imageUrls.length;

  // Notify parent when all pages become visible
  useEffect(() => {
    onAllPagesVisible?.(allPagesVisible);
  }, [allPagesVisible, onAllPagesVisible]);

  const loadNextBatch = useCallback(() => {
    setVisibleEnd((prev) => Math.min(imageUrls.length, prev + BATCH_SIZE));
  }, [imageUrls.length]);

  // Initialize loading: load a window around the resume page first
  const [images, setImages] = useState<ImageEntry[]>(() => {
    const start = Math.max(0, resumePageIndex);
    const end = Math.min(imageUrls.length - 1, start + PRELOAD_AHEAD);
    return Array.from({ length: imageUrls.length }, (_, i) => ({
      state: (i >= start && i <= end ? "loading" : "pending") as ImageState,
      retries: 0,
    }));
  });

  // Mark an image as loading when it enters the preload window
  const triggerLoad = useCallback(
    (index: number) => {
      setImages((prev) => {
        if (prev[index]?.state !== "pending") return prev;
        const next = [...prev];
        next[index] = { ...next[index], state: "loading" };
        return next;
      });
    },
    [],
  );

  const handleImageLoad = useCallback(
    (index: number, img: HTMLImageElement) => {
      setImages((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          state: "loaded",
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
        };
        return next;
      });
      // Preload upcoming images when one loads (only within visible range)
      for (let i = index + 1; i <= index + PRELOAD_AHEAD && i < imageUrls.length; i++) {
        triggerLoad(i);
      }
    },
    [imageUrls.length, triggerLoad],
  );

  const handleImageError = useCallback((index: number) => {
    setImages((prev) => {
      const next = [...prev];
      const entry = next[index];
      if (entry.retries < MAX_RETRIES) {
        next[index] = { ...entry, state: "loading", retries: entry.retries + 1 };
      } else {
        next[index] = { ...entry, state: "error" };
      }
      return next;
    });
  }, []);

  const handleRetry = useCallback((index: number) => {
    setImages((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], state: "loading", retries: 0 };
      return next;
    });
  }, []);

  // After the resume page image loads, scroll to it once
  useEffect(() => {
    if (hasScrolledToResume.current || resumePageIndex <= 0) {
      hasScrolledToResume.current = true;
      return;
    }
    const entry = images[resumePageIndex];
    if (entry?.state === "loaded") {
      const el = imageRefs.current[resumePageIndex];
      if (el) {
        el.scrollIntoView({ behavior: "instant", block: "start" });
        hasScrolledToResume.current = true;
      }
    }
  }, [images, resumePageIndex]);

  // Preload images before resume page (already-read pages) after initial render
  useEffect(() => {
    if (resumePageIndex <= 0) return;
    for (let i = 0; i < resumePageIndex; i++) {
      triggerLoad(i);
    }
  }, [resumePageIndex, triggerLoad]);

  // Track scroll progress via IntersectionObserver + preload ahead
  useEffect(() => {
    const refs = imageRefs.current.filter(Boolean) as HTMLDivElement[];
    if (refs.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute("data-index"));
            if (idx > maxVisibleRef.current) {
              maxVisibleRef.current = idx;
            }
            // Preload images ahead of viewport (within visible range)
            for (let i = idx + 1; i <= idx + PRELOAD_AHEAD && i < imageUrls.length; i++) {
              triggerLoad(i);
            }
          }
        }
        const pageIndex = maxVisibleRef.current;
        onProgressChange(((pageIndex + 1) / imageUrls.length) * 100, pageIndex);
      },
      { threshold: 0.1, rootMargin: OBSERVER_ROOT_MARGIN },
    );

    for (const ref of refs) observer.observe(ref);
    return () => observer.disconnect();
  }, [imageUrls.length, onProgressChange, triggerLoad, visibleEnd]);

  // How many pages remain beyond the current visible window
  const remainingPages = imageUrls.length - visibleEnd;

  return (
    <div ref={containerRef} className="w-full" onClick={onTap}>
      <div className="mx-auto max-w-[800px]">
        {imageUrls.slice(0, visibleEnd).map((url, i) => {
          const entry = images[i] ?? { state: "pending" as const, retries: 0 };
          const shouldRender = entry.state !== "pending";
          const isLoaded = entry.state === "loaded";
          const isError = entry.state === "error";

          // Use aspect ratio from loaded image to prevent layout shift
          const aspectStyle =
            isLoaded && entry.naturalWidth && entry.naturalHeight
              ? { aspectRatio: `${entry.naturalWidth} / ${entry.naturalHeight}` }
              : undefined;

          return (
            <div
              key={i}
              ref={(el) => {
                imageRefs.current[i] = el;
              }}
              data-index={i}
              className="relative w-full"
              style={aspectStyle}
            >
              {/* Placeholder — pending (queued) vs loading (fetching from network) */}
              {!isLoaded && !isError && (
                <div
                  className="flex flex-col items-center justify-center gap-3 border border-terminal-border/20 bg-terminal-bg w-full"
                  style={{ aspectRatio: EXPECTED_ASPECT_RATIO }}
                >
                  {entry.state === "loading" ? (
                    <>
                      <div className="w-24 h-px text-terminal-green/40 loading-bar-track rounded" />
                      <span className="text-[0.6rem] text-terminal-dim">
                        {">"} loading image {String(i + 1).padStart(3, "0")}
                        <span className="loading-dots" />
                      </span>
                    </>
                  ) : (
                    <span className="text-[0.6rem] text-terminal-dim">
                      {">"} image {String(i + 1).padStart(3, "0")}
                      <span className="blink-cursor">_</span>
                    </span>
                  )}
                </div>
              )}

              {/* Error state with retry */}
              {isError && (
                <div
                  className="flex flex-col items-center justify-center border border-terminal-orange/30 bg-terminal-orange/[0.03] w-full"
                  style={{ aspectRatio: EXPECTED_ASPECT_RATIO }}
                >
                  <span className="text-[0.6rem] text-terminal-orange">
                    {">"} ERR: failed to load image{" "}
                    {String(i + 1).padStart(3, "0")}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRetry(i);
                    }}
                    className="mt-2 text-[0.6rem] text-terminal-cyan hover:text-terminal-green transition-colors"
                  >
                    [ RETRY ]
                  </button>
                </div>
              )}

              {/* Actual image - only add to DOM when in preload window */}
              {shouldRender && !isError && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={
                    entry.retries > 0
                      ? `${url}${url.includes("?") ? "&" : "?"}r=${entry.retries}`
                      : url
                  }
                  alt={`Page ${i + 1}`}
                  loading="eager"
                  className={`w-full block reader-image ${isLoaded ? "" : "h-0 overflow-hidden"}`}
                  onLoad={(e) =>
                    handleImageLoad(i, e.target as HTMLImageElement)
                  }
                  onError={() => handleImageError(i)}
                />
              )}
            </div>
          );
        })}

        {/* Load next batch button */}
        {!allPagesVisible && (
          <div className="py-8 flex flex-col items-center gap-3">
            <span className="text-[0.65rem] text-terminal-dim">
              {">"} showing {visibleEnd} of {imageUrls.length} pages
              {" — "}{remainingPages} remaining
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                loadNextBatch();
              }}
              className="px-6 py-3 border border-terminal-green/40 text-terminal-green text-xs
                hover:bg-terminal-green/10 hover:border-terminal-green/60 transition-colors"
            >
              [ LOAD NEXT {Math.min(BATCH_SIZE, remainingPages)} PAGES ]
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
