"use client";

import { useEffect, useRef, useCallback, useState } from "react";

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
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

  const handleImageLoad = useCallback((index: number) => {
    setLoadedImages((prev) => new Set(prev).add(index));
  }, []);

  // Track scroll progress via IntersectionObserver
  useEffect(() => {
    const refs = imageRefs.current.filter(Boolean) as HTMLDivElement[];
    if (refs.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let maxVisibleIndex = 0;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute("data-index"));
            if (idx > maxVisibleIndex) maxVisibleIndex = idx;
          }
        }
        onProgressChange(((maxVisibleIndex + 1) / imageUrls.length) * 100);
      },
      { threshold: 0.1 },
    );

    for (const ref of refs) observer.observe(ref);
    return () => observer.disconnect();
  }, [imageUrls.length, onProgressChange]);

  return (
    <div ref={containerRef} className="w-full" onClick={onTap}>
      <div className="mx-auto max-w-[800px]">
        {imageUrls.map((url, i) => (
          <div
            key={i}
            ref={(el) => { imageRefs.current[i] = el; }}
            data-index={i}
            className="relative w-full"
          >
            {!loadedImages.has(i) && (
              <div className="flex items-center justify-center h-[300px] border border-terminal-border/20 bg-terminal-bg">
                <span className="text-[0.6rem] text-terminal-dim">
                  {">"} loading image {String(i + 1).padStart(3, "0")}
                  <span className="blink-cursor">_</span>
                </span>
              </div>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`Page ${i + 1}`}
              loading="lazy"
              className={`w-full block reader-image ${loadedImages.has(i) ? "" : "h-0 overflow-hidden"}`}
              onLoad={() => handleImageLoad(i)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
