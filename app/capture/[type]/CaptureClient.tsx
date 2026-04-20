"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { DeviceTemplate } from "@/lib/templates";
import { CameraView, type CameraViewHandle } from "@/components/CameraView";
import { GuideOverlay } from "@/components/GuideOverlay";
import { LevelIndicator } from "@/components/LevelIndicator";
import { DistanceHint } from "@/components/DistanceHint";
import { CaptureButton } from "@/components/CaptureButton";
import { savePhoto } from "@/lib/storage";

interface Props {
  template: DeviceTemplate;
}

export function CaptureClient({ template }: Props) {
  const router = useRouter();
  const cameraRef = useRef<CameraViewHandle | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [opacity, setOpacity] = useState(0.5);
  const [levelReady, setLevelReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [showTips, setShowTips] = useState(true);

  // Expose video element to DistanceHint by reading through the ref.
  const attachVideo = useCallback(() => {
    videoRef.current = cameraRef.current?.video ?? null;
  }, []);

  const handleCapture = useCallback(async () => {
    if (capturing) return;
    setCapturing(true);
    try {
      attachVideo();
      const shot = await cameraRef.current?.capture();
      if (!shot) return;
      const id = await savePhoto({
        deviceType: template.id,
        blob: shot.blob,
        width: shot.width,
        height: shot.height,
      });
      router.push(`/edit/${id}`);
    } finally {
      setCapturing(false);
    }
  }, [capturing, template.id, router, attachVideo]);

  const hintProps = useMemo(() => ({ videoRef }), []);

  return (
    <div className="fixed inset-0 z-0 min-h-[100dvh] bg-black text-white">
      <CameraView
        ref={(h) => {
          cameraRef.current = h;
          attachVideo();
        }}
        onReady={attachVideo}
      />

      <GuideOverlay template={template} opacity={opacity} ready={levelReady} />

      {/* Top bar */}
      <div className="absolute inset-x-0 top-0 z-20 pt-safe">
        <div className="flex items-start justify-between px-4 pt-3">
          <Link
            href="/"
            className="pointer-events-auto flex items-center gap-1 rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
            </svg>
            Geri
          </Link>
          <LevelIndicator onReadyChange={setLevelReady} />
          <button
            type="button"
            onClick={() => setShowTips((s) => !s)}
            className="pointer-events-auto rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium"
          >
            {showTips ? "İpuçları Gizle" : "İpuçları"}
          </button>
        </div>
        <div className="px-4 mt-2 flex justify-center">
          <DistanceHint {...hintProps} />
        </div>
      </div>

      {/* Tips bubble */}
      {showTips && (
        <div className="absolute inset-x-0 top-20 z-20 flex justify-center px-4">
          <div className="max-w-sm rounded-xl bg-black/75 px-3 py-2 text-xs text-white/90">
            <p className="font-semibold text-emerald-300 mb-1">
              {template.name}
            </p>
            <ul className="space-y-1 list-disc list-inside">
              {template.tips.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div className="absolute inset-x-0 bottom-0 z-20 pb-safe">
        <div className="flex flex-col items-center gap-3 px-4 pb-4">
          <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-black/70 px-4 py-2">
            <span className="text-[11px] text-white/70">Şeffaflık</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(opacity * 100)}
              onChange={(e) => setOpacity(Number(e.target.value) / 100)}
              className="h-1 w-32 accent-emerald-400"
            />
          </div>

          <div className="flex items-center gap-8">
            <div className="w-12" />
            <CaptureButton
              onCapture={handleCapture}
              disabled={capturing}
              ready={levelReady}
            />
            <Link
              href="/gallery"
              className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/15"
              aria-label="Galeri"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
              >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12l3 3 5-6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
