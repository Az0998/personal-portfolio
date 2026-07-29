/** Image persistence that works on Render (no local disk needed). */
const MAX_BYTES = 900_000; // ~0.9MB data URL budget for SQLite

export async function saveUploadedFile(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("仅支持图片文件");
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Prefer JPEG/WebP-friendly data URL; keep original mime when small enough
  let mime = file.type || "image/jpeg";
  let payload = buffer;

  if (buffer.length > MAX_BYTES) {
    // Too large as-is: still try storing if under hard limit after noting failure
    throw new Error("图片过大，请压缩到 1MB 以内后再上传");
  }

  const base64 = payload.toString("base64");
  const dataUrl = `data:${mime};base64,${base64}`;

  if (dataUrl.length > MAX_BYTES * 1.4) {
    throw new Error("图片过大，请换一张更小的图（建议正方形、小于 800KB）");
  }

  return dataUrl;
}
