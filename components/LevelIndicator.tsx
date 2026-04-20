"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  /** Called with true if beta & gamma are within tolerance */
  onReadyChange?: (ready: boolean) => void;
  toleranceDeg?: number;
}

interface DeviceOrientationEventStatic {
  requestPermission?: () => Promise<"granted" | "denied">;
}

type OrientationState =
  | { kind: "unsupported" }
  | { kind: "needs-permission" }
  | { kind: "active"; beta: number; gamma: number }
  | { kind: "idle" };

/**
 * Bubble-style level indicator using DeviceOrientationEvent. iOS Safari
 * requires a user gesture before the event fires, hence the permission button.
 */
function detectInitialState(): OrientationState {
  if (typeof window === "undefined") return { kind: "idle" };
  if (!("DeviceOrientationEvent" in window)) return { kind: "unsupported" };
  const ctor = window.DeviceOrientationEvent as unknown as DeviceOrientationEventStatic;
  if (typeof ctor.requestPermission === "function") return { kind: "needs-permission" };
  return { kind: "idle" };
}

export function LevelIndicator({ onReadyChange, toleranceDeg = 4 }: Props) {
  const [state, setState] = useState<OrientationState>(detectInitialState);
  const handlerRef = useRef<(e: DeviceOrientationEvent) => void>(() => {});

  const attach = useCallback(() => {
    const handle = (e: DeviceOrientationEvent) => {
      setState({ kind: "active", beta: e.beta ?? 0, gamma: e.gamma ?? 0 });
    };
    handlerRef.current = handle;
    window.addEventListener("deviceorientation", handle);
    setState({ kind: "active", beta: 0, gamma: 0 });
  }, []);

  useEffect(() => {
    // Auto-attach only if the environment doesn't require an explicit user
    // gesture (non-iOS). iOS paths are handled via the permission button.
    // Subscribing to an external event source in an effect is the recommended
    // pattern; React flags the setState call but it is safe here.
    if (state.kind === "idle") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      attach();
    }
    return () => {
      if (handlerRef.current) {
        window.removeEventListener("deviceorientation", handlerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestPermission = useCallback(async () => {
    const ctor = window.DeviceOrientationEvent as unknown as DeviceOrientationEventStatic;
    try {
      const res = await ctor.requestPermission?.();
      if (res === "granted") attach();
    } catch {
      // ignore
    }
  }, [attach]);

  const beta = state.kind === "active" ? state.beta : 0;
  const gamma = state.kind === "active" ? state.gamma : 0;

  // The camera is typically held roughly vertical (beta near 90) when shooting
  // a tower/rack device. Accept a wider pitch tolerance for comfortable use.
  const pitchDelta = Math.abs(beta - 90);
  const rollDelta = Math.abs(gamma);
  const ready =
    state.kind === "active" &&
    pitchDelta <= toleranceDeg * 2 &&
    rollDelta <= toleranceDeg;

  useEffect(() => {
    onReadyChange?.(ready);
  }, [ready, onReadyChange]);

  if (state.kind === "needs-permission") {
    return (
      <button
        type="button"
        onClick={requestPermission}
        className="pointer-events-auto rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium"
      >
        Seviye göstergesini etkinleştir
      </button>
    );
  }

  if (state.kind !== "active") return null;

  const translate = Math.max(-40, Math.min(40, gamma));

  let label: string;
  if (ready) label = "HAZIR";
  else if (pitchDelta > toleranceDeg * 2)
    label = beta < 90 ? "Telefonu yukarı eğin" : "Telefonu dikleştirin";
  else label = gamma > 0 ? "Sağa yatık" : "Sola yatık";

  return (
    <div className="pointer-events-none flex flex-col items-center gap-1">
      <div
        className={`relative h-2 w-40 overflow-hidden rounded-full border ${
          ready ? "border-emerald-400/60 bg-emerald-400/20" : "border-white/40 bg-white/10"
        }`}
      >
        <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/50" />
        <span
          className={`absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full ${
            ready ? "bg-emerald-400" : "bg-white"
          }`}
          style={{
            left: `calc(50% + ${translate}px)`,
            transform: `translate(-50%, -50%)`,
            transition: "left 80ms linear",
          }}
        />
      </div>
      <div
        className={`text-[10px] font-medium tracking-wide ${
          ready ? "text-emerald-400" : "text-white/80"
        }`}
      >
        {label}
      </div>
    </div>
  );
}
