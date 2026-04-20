/**
 * Helpers for working with image blobs in the browser.
 */

export function blobToObjectUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

export function revokeObjectUrl(url: string): void {
  try {
    URL.revokeObjectURL(url);
  } catch {
    // ignore
  }
}

export async function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Görüntü yüklenemedi"));
      img.src = url;
    });
    return img;
  } finally {
    // Don't revoke immediately; callers may need the decoded image still.
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
}

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Returns a JPEG blob for the given crop rectangle (in source image pixels).
 */
export async function cropBlob(
  src: Blob,
  area: CropArea,
  quality = 0.95,
): Promise<{ blob: Blob; width: number; height: number }> {
  const img = await blobToImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(area.width));
  canvas.height = Math.max(1, Math.round(area.height));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context oluşturulamadı");
  ctx.drawImage(
    img,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Blob oluşturulamadı"))),
      "image/jpeg",
      quality,
    );
  });
  return { blob, width: canvas.width, height: canvas.height };
}
