export const WEBTOON_FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  Referer: "https://m.webtoons.com/",
};

export const WEBTOON_IMAGE_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  Referer: "https://www.webtoons.com/",
};

export const WEBTOON_IMAGE_DOMAINS = [
  "webtoon-phinf.pstatic.net",
  "swebtoon-phinf.pstatic.net",
  "cdn.webtoons.com",
];

export function parseImageUrlsFromHtml(html: string): string[] {
  const imageRegex = /<img[^>]+data-url="([^"]+)"[^>]*>/g;
  const images: string[] = [];
  let match;

  while ((match = imageRegex.exec(html)) !== null) {
    let url = match[1];
    try {
      const imgUrl = new URL(url);
      imgUrl.searchParams.delete("type");
      url = imgUrl.toString();
    } catch {
      // Use URL as-is if parsing fails
    }
    images.push(url);
  }

  return images;
}

export function resolveViewerUrl(viewerUrl: string): string {
  return viewerUrl.startsWith("/")
    ? `https://www.webtoons.com${viewerUrl}`
    : viewerUrl;
}

export function validateViewerUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname.includes("webtoons.com");
  } catch {
    return false;
  }
}

export function validateImageDomain(imageUrl: string): boolean {
  try {
    const parsed = new URL(imageUrl);
    return WEBTOON_IMAGE_DOMAINS.some(
      (d) => parsed.hostname === d || parsed.hostname.endsWith(`.${d}`),
    );
  } catch {
    return false;
  }
}

export async function fetchWebtoonPage(viewerUrl: string): Promise<string> {
  const fullUrl = resolveViewerUrl(viewerUrl);

  if (!validateViewerUrl(fullUrl)) {
    throw new Error("Invalid viewer URL domain");
  }

  const res = await fetch(fullUrl, { headers: WEBTOON_FETCH_HEADERS });

  if (!res.ok) {
    throw new Error(`Webtoon viewer returned ${res.status}`);
  }

  return res.text();
}

export async function fetchWebtoonImage(
  imageUrl: string,
): Promise<{ buffer: ArrayBuffer; contentType: string }> {
  if (!validateImageDomain(imageUrl)) {
    throw new Error("Image domain not allowed");
  }

  const res = await fetch(imageUrl, { headers: WEBTOON_IMAGE_HEADERS });

  if (!res.ok) {
    throw new Error(`Image fetch failed: ${res.status}`);
  }

  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  const buffer = await res.arrayBuffer();

  return { buffer, contentType };
}
