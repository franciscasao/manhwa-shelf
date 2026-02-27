import { NextRequest, NextResponse } from "next/server";
import { getSource } from "@/extensions";

export async function GET(request: NextRequest) {
  const sourceId = request.nextUrl.searchParams.get("sourceId");
  const seriesId = request.nextUrl.searchParams.get("seriesId");

  if (!sourceId || !seriesId) {
    return NextResponse.json({ error: "Missing sourceId or seriesId parameter" }, { status: 400 });
  }

  const source = getSource(sourceId);
  if (!source) {
    return NextResponse.json({ error: `Unknown source: ${sourceId}` }, { status: 400 });
  }

  try {
    const chapters = await source.fetchChapterList(seriesId);
    return NextResponse.json({ chapters });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch chapters" },
      { status: 502 },
    );
  }
}
