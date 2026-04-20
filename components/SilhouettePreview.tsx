import type { DeviceTemplate } from "@/lib/templates";

interface Props {
  template: DeviceTemplate;
  className?: string;
  strokeOpacity?: number;
}

/**
 * Renders the device silhouette inside a 100 x (100/aspect) SVG viewBox.
 * `currentColor` drives the stroke so callers control color with Tailwind text-*.
 */
export function SilhouettePreview({ template, className, strokeOpacity = 1 }: Props) {
  const w = 100;
  const h = 100 / template.aspect;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      style={{ strokeOpacity }}
    >
      {template.paths.map((p, i) => (
        <path
          key={i}
          d={p.d}
          stroke={p.stroke ?? "currentColor"}
          strokeWidth={p.strokeWidth ?? 1}
          fill={p.fill ?? "none"}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={p.dashed ? "2 2" : undefined}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}
