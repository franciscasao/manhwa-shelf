import { initTRPC } from "@trpc/server";
import { getServerPB } from "@/lib/db-server";

export const createTRPCContext = async () => {
  return { pb: await getServerPB() };
};

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<TRPCContext>().create();

export const createTRPCRouter = t.router;
export const baseProcedure = t.procedure;
