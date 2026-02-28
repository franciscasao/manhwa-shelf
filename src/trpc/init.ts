import { initTRPC } from "@trpc/server";
import { getServerPB } from "@/lib/db-server";

export const createTRPCContext = () => {
  return { pb: getServerPB() };
};

export type TRPCContext = ReturnType<typeof createTRPCContext>;

const t = initTRPC.context<TRPCContext>().create();

export const createTRPCRouter = t.router;
export const baseProcedure = t.procedure;
