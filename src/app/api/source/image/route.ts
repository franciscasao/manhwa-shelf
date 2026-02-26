import { NextRequest, NextResponse } from "next/server";
import { validateImageDomain } from "@/extensions";

export async function GET(request: NextRequest) {
  const imageUrl = request.nextUrl.searchParams.get("url");

  if (!imageUrl) {
    return NextResponse.json(
      { error: "Missing url parameter" },
      { status: 400 },
    );
  }

  const { valid, source } = validateImageDomain(imageUrl);
  if (!valid || !source) {
    return NextResponse.json(
      { error: "Image domain not allowed" },
      { status: 403 },
    );
  }

  const res = await fetch(imageUrl, { headers: source.imageHeaders });

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
