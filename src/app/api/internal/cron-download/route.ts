import { NextRequest, NextResponse } from "next/server";
import { runCronDownload } from "@/lib/cron-downloader";

/**
 * POST /api/internal/cron-download
 *
 * Internal endpoint called by the PocketBase cron hook to trigger
 * chapter auto-downloads. Secured by CRON_SECRET Bearer token.
 */
export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured on Next.js server" },
      { status: 500 },
    );
  }

  const auth = request.headers.get("authorization");
  const token = auth?.replace("Bearer ", "");

  if (token !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runCronDownload();

  return NextResponse.json(result);
}
