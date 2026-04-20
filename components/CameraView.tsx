"use client";

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";

export interface CameraViewHandle {
  capture: () => { blob: Blob; width: number; height: number } | null;
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

  useEffect(() => {
    let cancelled = false;

    async function start() {
      setStatus("requesting");
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Bu tarayıcı kamera erişimini desteklemiyor");
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 3840 },
            height: { ideal: 2160 },
          },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.setAttribute("playsinline", "true");
          video.muted = true;
          await video.play().catch(() => undefined);
        }
        setStatus("ready");
        onReady?.();
      } catch (err) {
        const e = err as Error;
        setStatus("error");
        setMessage(e.message || "Kameraya erişilemedi");
        onError?.(e);
      }
    }

    start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [facingMode, onReady, onError]);

  useImperativeHandle(ref, () => ({
    video: videoRef.current,
    capture: () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return null;
      const w = video.videoWidth;
      const h = video.videoHeight;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(video, 0, 0, w, h);
      // toBlob is async; produce a Blob synchronously via dataURL decode.
      const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
      const bin = atob(dataUrl.split(",")[1]);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      const blob = new Blob([arr], { type: "image/jpeg" });
      return { blob, width: w, height: h };
    },
  }));

  return (
    <div className="absolute inset-0 bg-black">
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        playsInline
        muted
        autoPlay
      />
      {status !== "ready" && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
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
