import { NextRequest, NextResponse } from "next/server";
import { runCronDownload } from "@/lib/cron-downloader";

/**
 * POST /api/cron/download
 *
 * Triggers the cron chapter download job manually.
 * Protected by CRON_SECRET env var — pass it as Bearer token or `secret` query param.
 * If CRON_SECRET is not set, falls back to PB admin credentials for auth.
 */
export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    const auth = request.headers.get("authorization");
    const querySecret = request.nextUrl.searchParams.get("secret");
    const token = auth?.replace("Bearer ", "") ?? querySecret;

    if (token !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else {
    // If no CRON_SECRET, require PB admin credentials in the request
    const email = request.headers.get("x-pb-email");
    const password = request.headers.get("x-pb-password");

    if (
      !email ||
      !password ||
      email !== process.env.PB_ADMIN_EMAIL ||
      password !== process.env.PB_ADMIN_PASSWORD
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await runCronDownload();

  return NextResponse.json(result);
}

/**
 * GET /api/cron/download
 *
 * Health check — returns whether the cron scheduler is active.
 */
export async function GET() {
  const { isCronRunning } = await import("@/lib/cron-downloader");
  return NextResponse.json({ cronActive: isCronRunning() });
}
