import sharp from "sharp";

const MAX_WIDTH = 1600; // 2x retina for 800px reader
const WEBP_QUALITY = 85;
const JPEG_QUALITY = 85;

export async function optimizeImage(
  buffer: Uint8Array,
  contentType: string,
): Promise<{ buffer: Uint8Array; contentType: string }> {
  // Preserve GIFs (may be animated)
  if (contentType.includes("gif")) {
    return { buffer, contentType };
  }

  const pipeline = sharp(buffer).resize({ width: MAX_WIDTH, withoutEnlargement: true });

  // JPEG → stay as JPEG (avoid lossy-to-lossy transcoding)
  if (contentType.includes("jpeg") || contentType.includes("jpg")) {
    const result = await pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer();
    return {
      buffer: new Uint8Array(result.buffer, result.byteOffset, result.byteLength),
      contentType: "image/jpeg",
    };
  }

  // PNG and other lossless formats → convert to WebP
  const result = await pipeline.webp({ quality: WEBP_QUALITY }).toBuffer();
  return {
    buffer: new Uint8Array(result.buffer, result.byteOffset, result.byteLength),
    contentType: "image/webp",
  };
}
