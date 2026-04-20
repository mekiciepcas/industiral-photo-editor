"use client";

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";

export interface CameraViewHandle {
  /** Async: uses canvas.toBlob (faster than toDataURL on large frames). */
  capture: () => Promise<{ blob: Blob; width: number; height: number } | null>;
  video: HTMLVideoElement | null;
}

interface Props {
  onReady?: () => void;
  onError?: (err: Error) => void;
  facingMode?: "environment" | "user";
}

/**
 * Owns the MediaStream lifecycle and exposes a capture() method via ref.
 * capture() grabs the current frame from a hidden offscreen canvas and
 * returns a JPEG Blob with the native video resolution.
 */
export const CameraView = forwardRef<CameraViewHandle, Props>(function CameraView(
  { onReady, onError, facingMode = "environment" },
  ref,
) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<"idle" | "requesting" | "ready" | "error">("idle");
  const [message, setMessage] = useState<string>("");
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    let cancelled = false;
    let readyDone = false;
    let videoEl: HTMLVideoElement | null = null;
    let onFirstFrame: (() => void) | null = null;
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined;

    const fireReady = () => {
      if (cancelled || readyDone) return;
      readyDone = true;
      if (fallbackTimer !== undefined) clearTimeout(fallbackTimer);
      setStatus("ready");
      onReadyRef.current?.();
    };

    async function start() {
      setStatus("requesting");
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Bu tarayıcı kamera erişimini desteklemiyor");
        }
        // 4K ideal kills mobile GPUs and delays first frame; 1080p is plenty for this app.
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) {
          setStatus("error");
          setMessage("Video öğesi hazır değil");
          onErrorRef.current?.(new Error("Video ref missing"));
          return;
        }
        videoEl = video;
        video.srcObject = stream;
        video.setAttribute("playsinline", "true");
        video.setAttribute("webkit-playsinline", "true");
        video.muted = true;
        const onLoadedData = () => {
          video.removeEventListener("loadeddata", onLoadedData);
          fireReady();
        };
        onFirstFrame = onLoadedData;
        video.addEventListener("loadeddata", onLoadedData);
        await video.play().catch(() => undefined);
        if (!cancelled && video.readyState >= 2) {
          video.removeEventListener("loadeddata", onLoadedData);
          fireReady();
        }
        // Rare devices: no loadeddata; still show UI after a short wait so preview is not stuck.
        fallbackTimer = setTimeout(() => {
          if (!cancelled && video.readyState >= 1) {
            video.removeEventListener("loadeddata", onLoadedData);
            fireReady();
          }
        }, 2500);
      } catch (err) {
        const e = err as Error;
        setStatus("error");
        setMessage(e.message || "Kameraya erişilemedi");
        onErrorRef.current?.(e);
      }
    }

    start();
    return () => {
      cancelled = true;
      if (fallbackTimer !== undefined) clearTimeout(fallbackTimer);
      if (videoEl && onFirstFrame) {
        videoEl.removeEventListener("loadeddata", onFirstFrame);
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [facingMode]);

  useImperativeHandle(ref, () => ({
    get video() {
      return videoRef.current;
    },
    capture: () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return Promise.resolve(null);
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (w < 2 || h < 2) return Promise.resolve(null);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return Promise.resolve(null);
      try {
        ctx.drawImage(video, 0, 0, w, h);
      } catch {
        return Promise.resolve(null);
      }
      return new Promise((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(null);
              return;
            }
            resolve({ blob, width: w, height: h });
          },
          "image/jpeg",
          0.92,
        );
      });
    },
  }));

  return (
    <div className="absolute inset-0 z-0 bg-black">
      <video
        ref={videoRef}
        className="h-full w-full min-h-0 object-cover opacity-100"
        style={{ transform: "translateZ(0)" }}
        playsInline
        muted
        autoPlay
      />
      {status !== "ready" && (
        <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center p-6 text-center">
          <div className="max-w-xs">
            {status === "error" ? (
              <>
                <p className="text-sm font-medium text-red-300">{message}</p>
                <p className="mt-2 text-xs text-neutral-400">
                  Sayfaya tarayıcı ayarlarından kamera izni verdiğinizden ve
                  sayfanın HTTPS üzerinden açıldığından emin olun.
                </p>
              </>
            ) : (
              <p className="text-sm text-neutral-300">Kamera hazırlanıyor...</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
