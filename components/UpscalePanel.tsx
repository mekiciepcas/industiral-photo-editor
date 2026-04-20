"use client";

import { useCallback, useRef, useState } from "react";
import { upscaleBlob, type UpscaleFactor } from "@/lib/upscale";

interface Props {
  sourceBlob: Blob;
  onComplete: (blob: Blob, width: number, height: number) => void | Promise<void>;
}

type State =
  | { kind: "idle" }
  | { kind: "running"; progress: number; factor: UpscaleFactor }
  | { kind: "done"; factor: UpscaleFactor }
  | { kind: "error"; message: string };

export function UpscalePanel({ sourceBlob, onComplete }: Props) {
  const [factor, setFactor] = useState<UpscaleFactor>(2);
  const [state, setState] = useState<State>({ kind: "idle" });
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setState({ kind: "running", progress: 0, factor });
    try {
      const { blob, width, height } = await upscaleBlob(sourceBlob, {
        factor,
        signal: ac.signal,
        onProgress: (p) => {
          setState((prev) =>
            prev.kind === "running" ? { ...prev, progress: p } : prev,
          );
        },
      });
      await onComplete(blob, width, height);
      setState({ kind: "done", factor });
    } catch (err) {
      const e = err as Error;
      setState({ kind: "error", message: e.message || "Bilinmeyen hata" });
    }
  }, [factor, sourceBlob, onComplete]);

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-3">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm font-medium">AI Çözünürlük Artır</p>
          <p className="text-[11px] text-neutral-400">
            Fotoğrafın çözünürlüğünü ESRGAN modeli ile yükseltir.
          </p>
        </div>
        <div className="flex gap-1">
          {[2, 3, 4].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFactor(f as UpscaleFactor)}
              disabled={state.kind === "running"}
              className={`h-8 w-10 rounded-lg text-xs font-semibold transition ${
                factor === f
                  ? "bg-emerald-500 text-neutral-950"
                  : "bg-neutral-800 text-neutral-300"
              } disabled:opacity-50`}
            >
              {f}x
            </button>
          ))}
        </div>
      </div>

      {state.kind === "running" && (
        <div className="mt-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
            <div
              className="h-full bg-emerald-500 transition-[width] duration-150 ease-linear"
              style={{ width: `${Math.round(state.progress * 100)}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-neutral-400">
            İşleniyor… %{Math.round(state.progress * 100)} (model ilk yüklemede
            biraz zaman alabilir)
          </p>
        </div>
      )}

      {state.kind === "error" && (
        <p className="mt-2 text-xs text-red-400">Hata: {state.message}</p>
      )}

      {state.kind === "done" && (
        <p className="mt-2 text-xs text-emerald-400">
          {state.factor}x artırıldı. Önizleme güncellendi.
        </p>
      )}

      <button
        type="button"
        onClick={run}
        disabled={state.kind === "running"}
        className="mt-3 w-full rounded-xl bg-white/10 py-2 text-sm font-medium disabled:opacity-50"
      >
        {state.kind === "running" ? "İşleniyor..." : `${factor}x ile Uygula`}
      </button>
    </div>
  );
}
