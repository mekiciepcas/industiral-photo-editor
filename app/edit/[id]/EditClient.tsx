"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { getPhoto, updatePhoto, type PhotoRecord } from "@/lib/storage";
import { cropBlob, type CropArea } from "@/lib/image";
import { UpscalePanel } from "@/components/UpscalePanel";
import { formatBytes } from "@/lib/utils";

// react-easy-crop's type declarations mark all props as required despite having
// defaultProps; cast to a permissive component type so we can omit defaults.
const Cropper = dynamic(() => import("react-easy-crop"), {
  ssr: false,
}) as unknown as React.ComponentType<{
  image: string;
  crop: { x: number; y: number };
  zoom: number;
  rotation: number;
  aspect?: number;
  showGrid?: boolean;
  cropShape?: "rect" | "round";
  objectFit?: "contain" | "cover" | "horizontal-cover" | "vertical-cover";
  onCropChange: (p: { x: number; y: number }) => void;
  onZoomChange?: (z: number) => void;
  onRotationChange?: (r: number) => void;
  onCropComplete?: (
    area: { x: number; y: number; width: number; height: number },
    pixels: { x: number; y: number; width: number; height: number },
  ) => void;
}>;

interface Props {
  id: string;
}

type Mode = "view" | "crop";

export function EditClient({ id }: Props) {
  const [photo, setPhoto] = useState<PhotoRecord | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [mode, setMode] = useState<Mode>("view");

  // Cropper state
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedArea, setCroppedArea] = useState<CropArea | null>(null);

  // Derive object URLs directly from the photo during render. Revocation is
  // handled in a cleanup effect keyed on the photo itself.
  const originalUrl = useMemo(
    () => (photo ? URL.createObjectURL(photo.blob) : null),
    [photo],
  );
  const upscaledUrl = useMemo(
    () => (photo?.upscaledBlob ? URL.createObjectURL(photo.upscaledBlob) : null),
    [photo],
  );

  useEffect(() => {
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl);
      if (upscaledUrl) URL.revokeObjectURL(upscaledUrl);
    };
  }, [originalUrl, upscaledUrl]);

  useEffect(() => {
    let canceled = false;
    (async () => {
      const rec = await getPhoto(id);
      if (canceled) return;
      if (!rec) {
        setNotFound(true);
        return;
      }
      setPhoto(rec);
    })();
    return () => {
      canceled = true;
    };
  }, [id]);

  const displayBlob = useMemo(
    () => photo?.upscaledBlob ?? photo?.blob ?? null,
    [photo],
  );
  const displayUrl = upscaledUrl ?? originalUrl;
  const displayWidth = photo?.upscaledWidth ?? photo?.width ?? 0;
  const displayHeight = photo?.upscaledHeight ?? photo?.height ?? 0;

  const handleApplyCrop = useCallback(async () => {
    if (!photo || !croppedArea) return;
    const { blob, width, height } = await cropBlob(photo.blob, croppedArea);
    const updated = await updatePhoto(photo.id, {
      blob,
      width,
      height,
      upscaledBlob: undefined,
      upscaledWidth: undefined,
      upscaledHeight: undefined,
    });
    if (updated) setPhoto(updated);
    setMode("view");
    setZoom(1);
    setRotation(0);
    setCrop({ x: 0, y: 0 });
  }, [photo, croppedArea]);

  const handleUpscaleComplete = useCallback(
    async (blob: Blob, width: number, height: number) => {
      if (!photo) return;
      const updated = await updatePhoto(photo.id, {
        upscaledBlob: blob,
        upscaledWidth: width,
        upscaledHeight: height,
      });
      if (updated) setPhoto(updated);
    },
    [photo],
  );

  const handleDownload = useCallback(() => {
    if (!displayBlob || !photo) return;
    const ext = displayBlob.type.includes("png") ? "png" : "jpg";
    const a = document.createElement("a");
    const url = URL.createObjectURL(displayBlob);
    a.href = url;
    a.download = `ups-${photo.deviceType}-${photo.id.slice(0, 6)}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [displayBlob, photo]);

  const handleShare = useCallback(async () => {
    if (!displayBlob || !photo) return;
    const file = new File(
      [displayBlob],
      `ups-${photo.deviceType}.${displayBlob.type.includes("png") ? "png" : "jpg"}`,
      { type: displayBlob.type },
    );
    const shareData: ShareData = { files: [file], title: "UPS Photo" };
    if (
      typeof navigator !== "undefined" &&
      "share" in navigator &&
      "canShare" in navigator &&
      navigator.canShare?.(shareData)
    ) {
      try {
        await navigator.share(shareData);
      } catch {
        // user canceled
      }
    } else {
      handleDownload();
    }
  }, [displayBlob, photo, handleDownload]);

  if (notFound) {
    return (
      <main className="flex min-h-[100dvh] flex-1 items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-lg font-semibold">Fotoğraf bulunamadı</h1>
          <Link href="/" className="mt-3 inline-block text-sm text-emerald-400 underline">
            Ana ekrana dön
          </Link>
        </div>
      </main>
    );
  }

  if (!photo || !originalUrl) {
    return (
      <main className="flex min-h-[100dvh] flex-1 items-center justify-center">
        <p className="text-sm text-neutral-400">Yükleniyor...</p>
      </main>
    );
  }

  return (
    <main className="grid min-h-[100dvh] w-full grid-rows-[auto_minmax(0,1fr)_auto] bg-neutral-950 pt-safe pb-safe">
      <header className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
        <Link
          href="/"
          className="flex items-center gap-1 text-sm text-neutral-300"
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
          Ana Ekran
        </Link>
        <div className="text-xs text-neutral-400">
          {displayWidth} × {displayHeight}
          {" · "}
          {formatBytes(displayBlob?.size ?? 0)}
        </div>
      </header>

      <div className="relative min-h-0 overflow-hidden bg-black">
        {mode === "crop" ? (
          <Cropper
            image={originalUrl}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={4 / 3}
            showGrid
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={(_area, pixels) => setCroppedArea(pixels)}
            cropShape="rect"
            objectFit="contain"
          />
        ) : (
          displayUrl && (
            <div className="flex h-full min-h-[40dvh] w-full items-center justify-center p-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayUrl}
                alt="Çekilen fotoğraf"
                className="max-h-full max-w-full object-contain"
                draggable={false}
              />
            </div>
          )
        )}
      </div>

      {mode === "crop" ? (
        <div className="border-t border-neutral-800 bg-neutral-950 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-xs w-14 text-neutral-400">Zoom</span>
            <input
              type="range"
              min={1}
              max={4}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-emerald-400"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs w-14 text-neutral-400">Döndür</span>
            <input
              type="range"
              min={-180}
              max={180}
              step={1}
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              className="flex-1 accent-emerald-400"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setMode("view")}
              className="flex-1 rounded-xl border border-neutral-700 py-2.5 text-sm"
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={handleApplyCrop}
              className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-sm font-medium text-neutral-950"
            >
              Kırpmayı Uygula
            </button>
          </div>
        </div>
      ) : (
        <div className="border-t border-neutral-800 bg-neutral-950 p-4 space-y-3">
          <UpscalePanel sourceBlob={photo.blob} onComplete={handleUpscaleComplete} />
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setMode("crop")}
              className="rounded-xl border border-neutral-700 py-2.5 text-sm"
            >
              Kırp / Döndür
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="rounded-xl border border-neutral-700 py-2.5 text-sm"
            >
              İndir
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="rounded-xl bg-emerald-500 py-2.5 text-sm font-medium text-neutral-950"
            >
              Paylaş
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
