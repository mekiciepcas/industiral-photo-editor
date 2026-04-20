"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listPhotos, deletePhoto, type PhotoRecord } from "@/lib/storage";
import { TEMPLATES } from "@/lib/templates";
import { formatBytes, formatDate } from "@/lib/utils";

interface Item {
  record: PhotoRecord;
  url: string;
}

export function GalleryClient() {
  const [items, setItems] = useState<Item[] | null>(null);

  useEffect(() => {
    let urls: string[] = [];
    (async () => {
      const recs = await listPhotos();
      const mapped = recs.map((r) => {
        const blob = r.upscaledBlob ?? r.blob;
        const url = URL.createObjectURL(blob);
        urls.push(url);
        return { record: r, url };
      });
      setItems(mapped);
    })();
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
      urls = [];
    };
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Bu fotoğraf silinsin mi?")) return;
    await deletePhoto(id);
    setItems((curr) => curr?.filter((i) => i.record.id !== id) ?? null);
  }

  async function handleShare(item: Item) {
    const blob = item.record.upscaledBlob ?? item.record.blob;
    const ext = blob.type.includes("png") ? "png" : "jpg";
    const file = new File([blob], `ups-${item.record.deviceType}.${ext}`, {
      type: blob.type,
    });
    const data: ShareData = { files: [file], title: "UPS Photo" };
    if (
      typeof navigator !== "undefined" &&
      "share" in navigator &&
      navigator.canShare?.(data)
    ) {
      try {
        await navigator.share(data);
      } catch {
        // user canceled
      }
    } else {
      const a = document.createElement("a");
      a.href = item.url;
      a.download = file.name;
      a.click();
    }
  }

  return (
    <main className="flex-1 pt-safe pb-safe">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <header className="mb-5 flex items-center justify-between">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs text-neutral-400"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-3.5 w-3.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
              </svg>
              Ana Ekran
            </Link>
            <h1 className="mt-1 text-2xl font-semibold">Galeri</h1>
          </div>
        </header>

        {items === null ? (
          <p className="text-sm text-neutral-400">Yükleniyor...</p>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-800 p-8 text-center">
            <p className="text-sm text-neutral-400">
              Henüz kayıtlı fotoğraf yok.
            </p>
            <Link
              href="/"
              className="mt-3 inline-block rounded-full bg-emerald-500 px-4 py-2 text-xs font-medium text-neutral-950"
            >
              Çekime Başla
            </Link>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {items.map((item) => {
              const t = TEMPLATES[item.record.deviceType];
              const blob = item.record.upscaledBlob ?? item.record.blob;
              return (
                <li
                  key={item.record.id}
                  className="group overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/40"
                >
                  <Link
                    href={`/edit/${item.record.id}`}
                    className="block aspect-square bg-black"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt={t.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </Link>
                  <div className="p-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">{t.name}</span>
                      {item.record.upscaledBlob && (
                        <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-300">
                          Upscaled
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-neutral-500">
                      {formatDate(item.record.createdAt)}
                    </div>
                    <div className="text-[10px] text-neutral-500">
                      {(item.record.upscaledWidth ?? item.record.width)} ×{" "}
                      {(item.record.upscaledHeight ?? item.record.height)} ·{" "}
                      {formatBytes(blob.size)}
                    </div>
                    <div className="flex gap-1 pt-1">
                      <button
                        type="button"
                        onClick={() => handleShare(item)}
                        className="flex-1 rounded-md bg-white/10 py-1 text-[11px]"
                      >
                        Paylaş
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.record.id)}
                        className="flex-1 rounded-md bg-red-500/20 py-1 text-[11px] text-red-300"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
