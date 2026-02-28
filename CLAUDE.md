# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Manhwa-Shelf is a manga/manhwa library manager with a retro-terminal aesthetic. Users search AniList for manga (Japanese) and manhwa (Korean) titles, add them to a shelf (PocketBase), browse detail pages, and read downloaded chapters. Data syncs across devices via PocketBase real-time subscriptions. The frontend is a Next.js app with API routes that proxy AniList GraphQL queries and handle server-side chapter downloading.

## Commands

- `pnpm dev` — Start dev server (port 3000)
- `pnpm build` — Production build
- `pnpm lint` — Run ESLint
- `pnpm tsx scripts/setup-pocketbase.ts` — Bootstrap PocketBase collections (requires env vars)
- No test framework is configured

## PocketBase Setup

Requires a running PocketBase instance (default: `http://127.0.0.1:8090`).

Environment variables:
- `NEXT_PUBLIC_POCKETBASE_URL` — PocketBase URL (used by both client and server)
- `PB_ADMIN_EMAIL` / `PB_ADMIN_PASSWORD` — Superuser credentials for `setup-pocketbase.ts`

Collections (created by `scripts/setup-pocketbase.ts`):
- **`shelf`** — Library entries; one record per manga, ID is the AniList ID zero-padded to 15 chars
- **`chapterDownloads`** — Downloaded chapter images stored as PocketBase file fields; indexed by `mangaId`

## Tech Stack

- **Next.js 16** (App Router) with **React 19** and **TypeScript** (strict mode)
- **Tailwind CSS 4** + **shadcn/ui** (New York style, Lucide icons)
- **PocketBase** for persistence and cross-device sync (real-time SSE subscriptions)
- **pnpm** as the package manager

## Architecture

### Routing (`src/app/`)
- `/` — Dashboard with stats and manga table
- `/search` — AniList search with debounced input, add-to-shelf
- `/library` — Full library with grid/list views, filtering, sorting
- `/manhwa/[id]` — Detail page: AniList metadata, source chapters, chapter download controls
- `/manhwa/[id]/read/[chapter]` — Chapter reader: vertical image strip, toolbar auto-hide, keyboard nav, next-chapter prefetch
- `/api/anilist` — POST proxy to `https://graphql.anilist.co`
- `/api/source/chapters` — Fetches chapter list from any registered source extension
- `/api/source/download` — Streams chapter download progress via NDJSON (source-agnostic)
- `/api/source/image` — Proxies source images (bypasses Referer restrictions, checks all registered sources)
- `/api/chapter/[mangaId]/[chapterNum]` — Returns stored chapter data + prev/next navigation from PocketBase

### Data Flow
- `src/lib/db.ts` — Client-side PocketBase singleton (auto-cancellation disabled)
- `src/lib/db-server.ts` — `getServerPB()` for API routes (creates a fresh instance per request)
- `src/hooks/use-shelf.ts` — `useShelf()` hook: CRUD on `shelf` collection with real-time subscriptions
- `src/hooks/use-media-detail.ts` — Fetches AniList detail for a single title
- `src/hooks/use-source-chapters.ts` — Fetches chapter list from any source extension via `/api/source/chapters`
- `src/hooks/use-search-media.ts` — Debounced AniList search with pagination
- `src/hooks/use-chapter-download.ts` — Manages a download queue, calls `/api/source/download`, tracks per-chapter progress
- `src/hooks/use-chapter-reader.ts` — Loads chapter images from PocketBase; `usePrefetchChapter` preloads next chapter
- `src/lib/anilist.ts` — AniList GraphQL client; `mapAniListToManga()` converts to internal `Manga` type
- `src/lib/types.ts` — Core types (`Manga`, `DownloadStatus`, `DownloadStreamEvent`, etc.)
- `src/lib/manga-utils.ts` — `toPocketBaseId()`, `getDownloadStatus()`, `getPercent()`, `sortManga()`, `statusConfig`
- `src/lib/chapter-download.ts` — `downloadChapterToServer()`: streams NDJSON events from `/api/source/download`
- `src/extensions/` — Source extension system: `Source` interface, registry, and built-in extensions (Webtoons, Tapas)

### Chapter Download Pipeline
1. User triggers download → `use-chapter-download` enqueues `DownloadQueueItem` (with `sourceId` and `chapterUrl`)
2. Queue processes serially: calls `downloadChapterToServer()` with source ID and chapter URL
3. `/api/source/download` uses the source extension to fetch chapter pages → downloads images in batches of 3 → uploads to `chapterDownloads` collection → updates `shelf` downloaded count and size
4. Progress streamed back as NDJSON (`DownloadStreamEvent` union type)

### ID Mapping
AniList IDs are integers. PocketBase IDs must be 15-char strings: `toPocketBaseId(anilistId)` zero-pads them (e.g., `123456` → `"000000000123456"`).

### Components (`src/components/`)
- `ui/` — shadcn primitives
- `library/` — Library page components (toolbar, stats bar, terminal card, list row, empty state)
- `manhwa/` — Detail page components (header, metadata, synopsis, external links, relations, chapter directory)
- `reader/` — Reader components (toolbar, image strip, bottom nav)
- `navbar.tsx`, `manga-table.tsx`, `status-badge.tsx`, `progress-display.tsx`

## Conventions

- Interactive pages use `"use client"` directive
- Terminal aesthetic: monospace fonts (JetBrains Mono, Geist Mono), green/cyan/orange on dark background
- Custom CSS variables for theme colors (e.g., `--color-terminal-green: #00ff9f`) defined in `globals.css`
- Custom animations in `globals.css`: `blink-cursor`, `flicker`, `result-enter`, `shelf-enter`, `query-pulse`, `view-fade`, `detail-section`
- Path alias: `@/*` maps to `src/*`
- AniList search defaults to `countryOfOrigin: "KR"` (manhwa); pass `"ALL"` to omit the filter
