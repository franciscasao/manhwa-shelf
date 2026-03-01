import { createTRPCRouter } from "@/trpc/init";
import { anilistRouter } from "@/trpc/routers/anilist";
import { sourceRouter } from "@/trpc/routers/source";
import { chapterRouter } from "@/trpc/routers/chapter";
import { downloadRouter } from "@/trpc/routers/download";
import { catalogRouter } from "@/trpc/routers/catalog";

export const appRouter = createTRPCRouter({
  anilist: anilistRouter,
  source: sourceRouter,
  chapter: chapterRouter,
  download: downloadRouter,
  catalog: catalogRouter,
});

export type AppRouter = typeof appRouter;
