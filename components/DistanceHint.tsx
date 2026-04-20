"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  /** How often to sample (ms) */
  intervalMs?: number;
}

interface Sample {
  mean: number;
  contrast: number;
}

/**
 * Samples frames from the live video and shows hints about:
 *  - brightness (too dark / too bright)
 *  - framing via contrast heuristic (very low contrast => probably too close / blurry)
 *
 * This is intentionally lightweight - we don't run object detection, just quick
 * pixel stats on a downscaled frame.
 */
export function DistanceHint({ videoRef, intervalMs = 1800 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hint, setHint] = useState<string>("");

  useEffect(() => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
      canvasRef.current.width = 64;
      canvasRef.current.height = 64;
    }
    const timer = window.setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const sample = sampleFrame(data);
        setHint(hintFor(sample));
      } catch {
        // cross-origin or not ready
      }
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [videoRef, intervalMs]);

  if (!hint) return null;
  return (
    <div className="pointer-events-none rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white">
      {hint}
    </div>
  );
}

function sampleFrame(data: Uint8ClampedArray): Sample {
  let sum = 0;
  let sumSq = 0;
  const n = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    sum += lum;
    sumSq += lum * lum;
  }
  const mean = sum / n;
  const variance = sumSq / n - mean * mean;
  const contrast = Math.sqrt(Math.max(0, variance));
  return { mean, contrast };
}

function hintFor(s: Sample): string {
  if (s.mean < 45) return "Çok karanlık — ışığı arttırın";
  if (s.mean > 220) return "Aşırı pozlanma — ışığı azaltın";
  if (s.contrast < 14) return "Kontrast düşük — cihazı silüete hizalayın";
  return "";
}
