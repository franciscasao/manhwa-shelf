# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Manhwa-Shelf is a manga/manhwa library manager with a retro-terminal aesthetic. Users search AniList for manga (Japanese) and manhwa (Korean) titles, add them to a local shelf (IndexedDB via Dexie), and manage their collection. It runs entirely in the browser with no backend—only a thin API proxy route for AniList GraphQL queries.

## Commands

- `pnpm dev` — Start dev server (port 3000)
- `pnpm build` — Production build
- `pnpm lint` — Run ESLint
- No test framework is configured

## Tech Stack

- **Next.js 16** (App Router) with **React 19** and **TypeScript** (strict mode)
- **Tailwind CSS 4** + **shadcn/ui** (New York style, Lucide icons)
- **Dexie** (IndexedDB wrapper) + `dexie-react-hooks` for client-side persistence
- **pnpm** as the package manager

## Architecture

### Routing (`src/app/`)
- `/` — Dashboard with stats and manga table
- `/search` — AniList search with debounced input, add-to-shelf
- `/library` — Full library with grid/list views, filtering, sorting
- `/api/anilist` — POST proxy to `https://graphql.anilist.co`

### Data Flow
- `src/lib/db.ts` — Dexie database initialization
- `src/hooks/use-shelf.ts` — `useShelf()` hook providing CRUD on the shelf, uses `useLiveQuery()` for reactivity
- `src/lib/anilist.ts` — AniList GraphQL client, supports manga (`countryOfOrigin: "JP"`) and manhwa (`countryOfOrigin: "KR"`), and `mapAniListToManga()` to convert responses to internal `Manga` type
- `src/lib/types.ts` — Core types (`Manga`, `DownloadStatus`)
- `src/lib/manga-utils.ts` — Status calculation (`getDownloadStatus`, `getPercent`, `statusConfig`)

### Components (`src/components/`)
- `ui/` — shadcn primitives (Button, Card, Dialog, Table, etc.)
- `library/` — Library-specific components (toolbar, stats bar, terminal card, list row, empty state)
- `navbar.tsx`, `manga-table.tsx`, `status-badge.tsx`, `progress-display.tsx`

## Conventions

- Interactive pages use `"use client"` directive
- Terminal aesthetic: monospace fonts (JetBrains Mono, Geist Mono), green/cyan/orange on dark background
- Custom CSS variables for theme colors (e.g., `--color-terminal-green: #00ff9f`) defined in `globals.css`
- Custom animations in `globals.css`: `blink-cursor`, `flicker`, `result-enter`, `shelf-enter`, `query-pulse`, `view-fade`
- Path alias: `@/*` maps to `src/*`
