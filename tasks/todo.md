# Optimize Reader Prefetching

## Problem
The current reader has several suboptimal behaviors for 800x1200 manhwa images:
1. **Fixed-height placeholders** (`h-[300px]`) cause layout shift when images load (actual images are 1200px tall at full width)
2. **No rootMargin** on IntersectionObserver — images only start loading when they enter the viewport, causing visible loading delays
3. **Only tRPC data is prefetched** for the next chapter — actual image bytes aren't preloaded, so navigation still has a loading delay
4. **PRELOAD_AHEAD = 5** is arbitrary — for 800x1200 images at 800px max-width, each image is ~1200px tall, so 5 ahead = ~6000px. This is reasonable but the observer lacks rootMargin to trigger early enough

## Plan

### 1. Use known aspect ratio for placeholders
- Replace `h-[300px]` placeholder with `aspect-ratio: 2/3` (800/1200)
- This eliminates layout shift and makes scroll position/progress tracking accurate before images load

### 2. Add rootMargin to IntersectionObserver
- Add `rootMargin: "1200px 0px"` (one full image height below viewport)
- This triggers image loading ~1 image before it scrolls into view, giving time to fetch

### 3. Prefetch next chapter images (actual bytes)
- After tRPC data prefetch completes, use `new Image()` to preload the first few images of the next chapter
- This way when the user navigates, images are already in the browser cache

### 4. Tune preload constants
- Keep PRELOAD_AHEAD at 5 but add a separate `PREFETCH_NEXT_CHAPTER_IMAGES` constant for how many next-chapter images to preload (3-4 is sufficient for immediate display)

## Files to modify
- `src/components/reader/reader-image-strip.tsx` — placeholder, observer rootMargin
- `src/hooks/use-chapter-reader.ts` — image prefetching for next chapter
- `src/app/manhwa/[id]/read/[chapter]/page.tsx` — wire up image prefetching
