# Lazy Load Chapter Pages

## Task
Overhaul the reader to only auto-load 5 pages from resume point, with a "load next pages" button for subsequent batches.

## Plan
- [x] Add `visibleEnd` state to `ReaderImageStrip` to cap rendered pages
- [x] Only render pages up to `visibleEnd` (pages 0..resumePageIndex are pre-read, then 5 more)
- [x] Add "Load Next 5 Pages" button at the bottom of the visible range
- [x] Adjust progress tracking to still use total page count
- [x] Update page component if needed (bottom nav visibility)
- [x] Build check
