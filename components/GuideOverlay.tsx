"use client";

import type { DeviceTemplate } from "@/lib/templates";
import { SilhouettePreview } from "./SilhouettePreview";

interface Props {
  template: DeviceTemplate;
  opacity: number;
  viewportClass?: string;
  /** Show the silhouette with a highlight pulse when alignment is good */
  ready?: boolean;
}

/**
 * Full-screen overlay drawn above the live camera video. Shows:
 *  - a 3x3 rule-of-thirds grid
 *  - centered silhouette sized to match the device aspect ratio and fillTarget
 *  - center crosshair
 */
export function GuideOverlay({ template, opacity, ready = false }: Props) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Rule-of-thirds grid */}
      <svg
        className="absolute inset-0 h-full w-full text-white/20"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <line x1="33.33" y1="0" x2="33.33" y2="100" stroke="currentColor" strokeWidth="0.2" />
        <line x1="66.66" y1="0" x2="66.66" y2="100" stroke="currentColor" strokeWidth="0.2" />
        <line x1="0" y1="33.33" x2="100" y2="33.33" stroke="currentColor" strokeWidth="0.2" />
        <line x1="0" y1="66.66" x2="100" y2="66.66" stroke="currentColor" strokeWidth="0.2" />
      </svg>

      {/* Silhouette */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ opacity }}
      >
        <div
          className="flex items-center justify-center"
          style={{
            width: `${template.fillTarget * 100}%`,
            aspectRatio: String(template.aspect),
            maxHeight: `${template.fillTarget * 100}%`,
            maxWidth: `${template.fillTarget * 100}%`,
          }}
        >
          <SilhouettePreview
            template={template}
            className={
              ready
                ? "h-full w-full text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.5)] animate-pulse"
                : "h-full w-full text-white"
            }
          />
        </div>
      </div>

      {/* Center crosshair */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative h-6 w-6">
          <span className="absolute left-1/2 top-0 h-6 w-px -translate-x-1/2 bg-white/60" />
          <span className="absolute top-1/2 left-0 h-px w-6 -translate-y-1/2 bg-white/60" />
        </div>
      </div>
    </div>
  );
}
