import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1f2937 100%)",
          color: "#34d399",
          fontFamily: "system-ui, sans-serif",
          fontWeight: 800,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            lineHeight: 1,
          }}
        >
          <div style={{ fontSize: 54, color: "#34d399" }}>UPS</div>
          <div style={{ fontSize: 20, color: "#a7f3d0", marginTop: 4 }}>STUDIO</div>
        </div>
      </div>
    ),
    size,
  );
}
