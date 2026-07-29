/** Compress image in browser before upload (Render-friendly size). */
export async function compressImage(
  file: File,
  options?: { maxSize?: number; quality?: number; mime?: string }
): Promise<File> {
  const maxSize = options?.maxSize ?? 512;
  const quality = options?.quality ?? 0.82;
  const mime = options?.mime ?? "image/jpeg";

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, mime, quality)
  );
  if (!blob) return file;

  const name = file.name.replace(/\.\w+$/, "") + ".jpg";
  return new File([blob], name, { type: mime });
}
