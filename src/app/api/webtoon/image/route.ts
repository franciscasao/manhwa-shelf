import { NextRequest, NextResponse } from "next/server";
import {
  WEBTOON_IMAGE_DOMAINS,
  WEBTOON_IMAGE_HEADERS,
} from "@/lib/webtoon-scraper";

export async function GET(request: NextRequest) {
  const imageUrl = request.nextUrl.searchParams.get("url");

  if (!imageUrl) {
    return NextResponse.json(
      { error: "Missing url parameter" },
      { status: 400 },
    );
  }

  // Validate URL domain against allowlist
  try {
    const parsed = new URL(imageUrl);
    if (!WEBTOON_IMAGE_DOMAINS.some((d) => parsed.hostname === d || parsed.hostname.endsWith(`.${d}`))) {
      return NextResponse.json(
        { error: "Image domain not allowed" },
        { status: 403 },
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid image URL" },
      { status: 400 },
    );
  }

  const res = await fetch(imageUrl, { headers: WEBTOON_IMAGE_HEADERS });

  if (!res.ok) {
    return NextResponse.json(
      { error: `Image fetch failed: ${res.status}` },
      { status: res.status },
    );
  }

  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  const buffer = await res.arrayBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
