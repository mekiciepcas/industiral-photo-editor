"use client";

/**
 * Browser-only AI upscaling using UpscalerJS + ESRGAN-slim.
 * Dynamically imports TF.js and the model so the heavy payload is not shipped
 * with the initial bundle.
 */

export type UpscaleFactor = 2 | 3 | 4;

export interface UpscaleOptions {
  factor?: UpscaleFactor;
  /** Progress callback in [0,1] */
  onProgress?: (p: number) => void;
  /** Patch size - keeps memory bounded for large images. */
  patchSize?: number;
  padding?: number;
  signal?: AbortSignal;
}

export interface UpscaleResult {
  blob: Blob;
  width: number;
  height: number;
}

type UpscalerCtor = new (opts: { model: unknown }) => UpscalerInstance;

interface UpscalerInstance {
  upscale: (
    img: HTMLImageElement | string,
    opts: {
      patchSize?: number;
      padding?: number;
      output?: "base64" | "tensor" | "src";
      progress?: (pct: number) => void;
    },
  ) => Promise<string>;
  dispose: () => Promise<void>;
}

interface ModelCache {
  factor: UpscaleFactor;
  upscaler: UpscalerInstance;
}

let cached: ModelCache | null = null;

async function getUpscaler(factor: UpscaleFactor): Promise<UpscalerInstance> {
  if (cached && cached.factor === factor) return cached.upscaler;
  if (cached) {
    try {
      await cached.upscaler.dispose();
    } catch {
      // ignore
    }
    cached = null;
  }

  // Prime TF.js with a sensible backend in the browser.
  const tf = await import("@tensorflow/tfjs");
  await tf.ready();

  const upscalerMod = (await import("upscaler")) as unknown as {
    default: UpscalerCtor;
  };
  let model: unknown;
  if (factor === 2) {
    model = (await import("@upscalerjs/esrgan-slim/2x")).default;
  } else if (factor === 3) {
    model = (await import("@upscalerjs/esrgan-slim/3x")).default;
  } else {
    model = (await import("@upscalerjs/esrgan-slim/4x")).default;
  }
  const upscaler = new upscalerMod.default({ model });
  cached = { factor, upscaler };
  return upscaler;
}

function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Görüntü yüklenemedi"));
    };
    img.src = url;
  });
}

function base64ToBlob(b64: string, mime = "image/png"): Blob {
  const data = b64.includes(",") ? b64.split(",")[1] : b64;
  const bin = atob(data);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export async function upscaleBlob(
  source: Blob,
  opts: UpscaleOptions = {},
): Promise<UpscaleResult> {
  const factor = opts.factor ?? 2;
  const upscaler = await getUpscaler(factor);
  if (opts.signal?.aborted) throw new Error("İptal edildi");

  const img = await blobToImage(source);
  const b64 = await upscaler.upscale(img, {
    patchSize: opts.patchSize ?? 64,
    padding: opts.padding ?? 2,
    output: "base64",
    progress: (p: number) => opts.onProgress?.(Math.min(1, Math.max(0, p))),
  });

  const blob = base64ToBlob(b64, "image/png");
  // Decode once more to capture the final dimensions.
  const outImg = await blobToImage(blob);
  return { blob, width: outImg.naturalWidth, height: outImg.naturalHeight };
}

export async function disposeUpscaler(): Promise<void> {
  if (!cached) return;
  try {
    await cached.upscaler.dispose();
  } catch {
    // ignore
  }
  cached = null;
}
