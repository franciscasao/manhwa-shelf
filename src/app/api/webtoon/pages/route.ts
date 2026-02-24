import { NextRequest, NextResponse } from "next/server";
import {
  resolveViewerUrl,
  validateViewerUrl,
  parseImageUrlsFromHtml,
  WEBTOON_FETCH_HEADERS,
} from "@/lib/webtoon-scraper";

export async function GET(request: NextRequest) {
  const viewerUrl = request.nextUrl.searchParams.get("viewerUrl");

  if (!viewerUrl) {
    return NextResponse.json(
      { error: "Missing viewerUrl parameter" },
      { status: 400 },
    );
  }

  const fullUrl = resolveViewerUrl(viewerUrl);

  if (!validateViewerUrl(fullUrl)) {
    return NextResponse.json(
      { error: "Invalid viewer URL domain" },
      { status: 400 },
    );
  }

  const res = await fetch(fullUrl, { headers: WEBTOON_FETCH_HEADERS });

  if (!res.ok) {
    return NextResponse.json(
      { error: `Webtoon viewer returned ${res.status}` },
      { status: res.status },
    );
  }

  const html = await res.text();
  const images = parseImageUrlsFromHtml(html);

  return NextResponse.json({ images });
}
