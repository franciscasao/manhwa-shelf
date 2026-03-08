import { initTRPC, TRPCError } from "@trpc/server";
import { getServerPB } from "@/lib/db-server";

export const createTRPCContext = async (req?: Request) => {
  const pb = await getServerPB();
  let userId: string | null = null;

  if (req) {
    const auth = req.headers.get("Authorization");
    if (auth?.startsWith("Bearer ")) {
      const token = auth.slice(7);
      try {
        // Decode JWT payload (base64url) to extract user ID
        const payloadB64 = token.split(".")[1];
        const payload = JSON.parse(
          Buffer.from(payloadB64, "base64url").toString()
        );
        const id = payload.id as string | undefined;
        if (id) {
          userId = id;
        }
      } catch (err) {
        console.error("Failed to decode auth token:", err);
      }
    }
  }

  return { pb, userId };
};

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<TRPCContext>().create();

export const createTRPCRouter = t.router;
export const baseProcedure = t.procedure;

export const authedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication required" });
  }
  return next({ ctx: { ...ctx, userId: ctx.userId } });
});
