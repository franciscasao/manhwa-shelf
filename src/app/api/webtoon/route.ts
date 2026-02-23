import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const titleId = searchParams.get("titleId");
  const type = searchParams.get("type");

  if (!titleId || !type || (type !== "webtoon" && type !== "canvas")) {
    return NextResponse.json(
      { error: "Missing or invalid titleId/type" },
      { status: 400 },
    );
  }

  const url = `https://m.webtoons.com/api/v1/${type}/${titleId}/episodes?pageSize=99999`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
      Referer: "https://m.webtoons.com/",
    },
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: `Webtoon API returned ${res.status}` },
      { status: res.status },
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}
