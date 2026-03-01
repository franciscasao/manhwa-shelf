# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Manhwa-Shelf is a manga/manhwa library manager with a retro-terminal aesthetic. Users search AniList for manga (Japanese) and manhwa (Korean) titles, add them to a shelf (PocketBase), browse detail pages, and read downloaded chapters. Data syncs across devices via PocketBase real-time subscriptions. The frontend is a Next.js app with tRPC for type-safe API calls and server-side chapter downloading.

## Commands

- `pnpm dev` — Start dev server (port 3000)
- `pnpm build` — Production build
- `pnpm lint` — Run ESLint
- `pnpm db:setup` — Bootstrap PocketBase collections (reads `.env` automatically)
- No test framework is configured

## PocketBase Setup

Requires a running PocketBase instance (default: `http://127.0.0.1:8090`).

Environment variables:

- `NEXT_PUBLIC_POCKETBASE_URL` — PocketBase URL (used by both client and server)
- `PB_ADMIN_EMAIL` / `PB_ADMIN_PASSWORD` — Superuser credentials for setup script and server-side admin auth

Collections (created by `pnpm db:setup`):

- **`shelf`** — Library entries; one record per manga, ID is the AniList ID zero-padded to 15 chars
- **`chapterDownloads`** — Downloaded chapter images stored as PocketBase file fields; indexed by `mangaId`

## Tech Stack

- **Next.js 16** (App Router) with **React 19** and **TypeScript** (strict mode)
- **tRPC v11** with **TanStack React Query v5** for type-safe data fetching
- **Tailwind CSS 4** + **shadcn/ui** (New York style, Lucide icons)
- **PocketBase** for persistence and cross-device sync (real-time SSE subscriptions)
- **Zod v4** for validation
- **pnpm** as the package manager

## Architecture

### Routing (`src/app/`)

- `/` — Dashboard with stats and manga table
- `/login` — Login/registration (only public route)
- `/search` — AniList search with debounced input, add-to-shelf
- `/library` — Full library with grid/list views, filtering, sorting (URL-synced params)
- `/manhwa/[id]` — Detail page: AniList metadata, source chapters, chapter download controls
- `/manhwa/[id]/read/[chapter]` — Chapter reader: vertical image strip, toolbar auto-hide, keyboard nav, next-chapter prefetch
- `/api/trpc/[trpc]` — tRPC handler (GET + POST)
- `/api/source/image` — Image proxy (bypasses Referer restrictions, validates domains against registered sources)

### tRPC Layer (`src/trpc/`)

All data fetching goes through tRPC. The setup:

- `init.ts` — Creates tRPC context with PocketBase instance; defines `baseProcedure`
- `server.tsx` — Server-side options proxy for Server Components (`trpc` export, memoized with `cache()`)
- `client.tsx` — `TRPCReactProvider` with split links: `httpSubscriptionLink` for subscriptions, `httpBatchLink` for queries/mutations
- `query-client.ts` — Default 60s stale time, refetch-on-focus disabled

**Routers** (`src/trpc/routers/`):

- `_app.ts` — Root router merging all sub-routers
- `anilist.ts` — AniList GraphQL proxy (search, fetchById)
- `source.ts` — Chapter list fetching and caching (fetchChapters query, refreshChapters mutation)
- `chapter.ts` — Reader data with prev/next navigation (getReader query)
- `download.ts` — Download queue management with real-time progress via tRPC subscriptions (enqueue, cancel, status, progress)

### Authentication

- `src/hooks/use-auth.ts` — `useAuthProvider()` manages auth state via PocketBase authStore; hydrates after mount for SSR compatibility; requires user `verified` flag
- `src/components/auth-guard.tsx` — `AuthGuard` wraps all routes except `/login`; redirects unauthenticated users, logs out unverified users
- `src/components/providers.tsx` — Provides `AuthContext` and `TRPCReactProvider`
- Server-side admin auth: `getServerPB()` in `src/lib/db-server.ts` authenticates with `PB_ADMIN_EMAIL`/`PB_ADMIN_PASSWORD` per request

### Source Extensions (`src/extensions/`)

Pluggable system for fetching chapters from external manga/manhwa sources.

- `types.ts` — `Source` interface: `id`, `name`, `baseUrl`, `headers`, `imageHeaders`, `imageDomains`, `parseUrl()`, `fetchChapterList()`, `fetchChapterPages()`, optional `fetchMangaDetails()`
- `registry.ts` — Global `sources` Map with `registerSource()`, `getSource()`, `getAllSources()`, `identifySource()`, `validateImageDomain()`, `findSourceLink()`
- `index.ts` — Re-exports and auto-imports all extensions to trigger registration
- Built-in: **Webtoons** (mobile API + HTML scraping), **Tapas** (JSON API + HTML scraping), **QToon** (encrypted API with AES-128-CBC)

To add a new source: implement the `Source` interface, call `registerSource()`, and import it in `index.ts`.

### Data Flow

- `src/lib/db.ts` — Client-side PocketBase singleton (auto-cancellation disabled)
- `src/lib/db-server.ts` — `getServerPB()` for server-side routes (fresh admin-authed instance per request)
- `src/hooks/use-shelf.ts` — `useShelf()`: CRUD on `shelf` collection with real-time PocketBase subscriptions
- `src/hooks/use-source-chapters.ts` — Fetches chapter list via tRPC `source.fetchChapters`
- `src/hooks/use-chapter-download.ts` — Download queue, tracks per-chapter progress via tRPC subscriptions
- `src/hooks/use-chapter-reader.ts` — Loads chapter images from PocketBase; `usePrefetchChapter` preloads next chapter
- `src/lib/anilist.ts` — AniList GraphQL client; `mapAniListToManga()` converts to internal `Manga` type
- `src/lib/types.ts` — Core types (`Manga`, `DownloadStatus`, `DownloadStreamEvent`, etc.)
- `src/lib/manga-utils.ts` — `toPocketBaseId()`, `getDownloadStatus()`, `getPercent()`, `sortManga()`, `statusConfig`

### Chapter Download Pipeline

1. User triggers download → `use-chapter-download` enqueues `DownloadQueueItem` (with `sourceId` and `chapterUrl`)
2. Queue processes serially via tRPC `download.enqueue` mutation
3. Server-side: source extension fetches chapter pages → downloads images in batches of 3 → uploads to `chapterDownloads` collection → updates `shelf` downloaded count and size
4. Progress streamed back via tRPC subscription (`download.progress`)

### ID Mapping

AniList IDs are integers. PocketBase IDs must be 15-char strings: `toPocketBaseId(anilistId)` zero-pads them (e.g., `123456` → `"000000000123456"`).

## Conventions

- Interactive pages use `"use client"` directive
- Terminal aesthetic: monospace fonts (JetBrains Mono, Geist Mono), green/cyan/orange on dark background
- Custom CSS variables for theme colors (e.g., `--color-terminal-green: #00ff9f`) defined in `globals.css`
- Custom animations in `globals.css`: `blink-cursor`, `flicker`, `result-enter`, `shelf-enter`, `query-pulse`, `view-fade`, `detail-section`, `type-in`, `reader-image-enter`, `panel-slide-up`
- Path alias: `@/*` maps to `src/*`
- AniList search defaults to `countryOfOrigin: "KR"` (manhwa); pass `"ALL"` to omit the filter
- Hooks follow `use-[feature].ts` naming with `use[Feature]` exports
- Server Components use tRPC options proxy; Client Components use `useTRPCClient()` or tRPC React hooks

## Workflow Orchestration

1. Plan Mode Default

- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately – don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

2. Subagent Strategy

- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

3. Self-Improvement Loop

- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

4. Verification Before Done

- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

5. Demand Elegance (Balanced)

- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes – don't over-engineer
- Challenge your own work before presenting it

6. Autonomous Bug Fixing

- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests – then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.
