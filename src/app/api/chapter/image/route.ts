import { NextRequest, NextResponse } from "next/server";
import { getServerPB } from "@/lib/db-server";

// PocketBase appends a random suffix to uploaded filenames, e.g. "001_a1b2c3d4e5.jpg"
const FILENAME_RE = /^\d{3}_[a-zA-Z0-9]+\.(jpg|jpeg|webp|png|gif)$/;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const collectionId = searchParams.get("c");
  const recordId = searchParams.get("r");
  const filename = searchParams.get("f");

  if (!collectionId || !recordId || !filename) {
    return NextResponse.json({ error: "Missing c, r, or f parameter" }, { status: 400 });
  }

  if (!FILENAME_RE.test(filename)) {
    return NextResponse.json({ error: "Invalid filename format" }, { status: 400 });
  }

  const pb = await getServerPB();
  const url = pb.files.getURL({ collectionId, id: recordId } as never, filename);

  const res = await fetch(url);
  if (!res.ok) {
    return NextResponse.json({ error: `PocketBase fetch failed: ${res.status}` }, { status: res.status });
  }

  const contentType = res.headers.get("content-type") ?? "image/jpeg";

  return new NextResponse(res.body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
