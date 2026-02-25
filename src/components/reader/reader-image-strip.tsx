"use client";

import { useEffect, useRef, useCallback, useState } from "react";

const PRELOAD_AHEAD = 3;
const MAX_RETRIES = 3;

type ImageState = "pending" | "loading" | "loaded" | "error";

interface ImageEntry {
  state: ImageState;
  retries: number;
  naturalWidth?: number;
  naturalHeight?: number;
}

interface ReaderImageStripProps {
  imageUrls: string[];
  onProgressChange: (progress: number) => void;
  onTap: () => void;
}

export function ReaderImageStrip({
  imageUrls,
  onProgressChange,
  onTap,
}: ReaderImageStripProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const maxVisibleRef = useRef(0);

  // Initialize with the first batch already in "loading" state.
  // The parent should use a key prop to remount this component on chapter change.
  const [images, setImages] = useState<ImageEntry[]>(() =>
    Array.from({ length: imageUrls.length }, (_, i) => ({
      state: (i <= PRELOAD_AHEAD ? "loading" : "pending") as ImageState,
      retries: 0,
    })),
  );

  // Mark an image as loading when it enters the preload window
  const triggerLoad = useCallback((index: number) => {
    setImages((prev) => {
      if (prev[index]?.state !== "pending") return prev;
      const next = [...prev];
      next[index] = { ...next[index], state: "loading" };
      return next;
    });
  }, []);

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
      // Preload upcoming images when one loads
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
            // Preload images ahead of viewport
            for (let i = idx + 1; i <= idx + PRELOAD_AHEAD && i < imageUrls.length; i++) {
              triggerLoad(i);
            }
          }
        }
        onProgressChange(
          ((maxVisibleRef.current + 1) / imageUrls.length) * 100,
        );
      },
      { threshold: 0.1 },
    );

    for (const ref of refs) observer.observe(ref);
    return () => observer.disconnect();
  }, [imageUrls.length, onProgressChange, triggerLoad]);

  return (
    <div ref={containerRef} className="w-full" onClick={onTap}>
      <div className="mx-auto max-w-[800px]">
        {imageUrls.map((url, i) => {
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
              {/* Placeholder while loading */}
              {!isLoaded && !isError && (
                <div className="flex items-center justify-center h-[300px] border border-terminal-border/20 bg-terminal-bg">
                  <span className="text-[0.6rem] text-terminal-dim">
                    {">"} loading image {String(i + 1).padStart(3, "0")}
                    <span className="blink-cursor">_</span>
                  </span>
                </div>
              )}

              {/* Error state with retry */}
              {isError && (
                <div className="flex flex-col items-center justify-center h-[200px] border border-terminal-orange/30 bg-terminal-orange/[0.03]">
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
      </div>
    </div>
  );
}
