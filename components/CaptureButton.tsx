"use client";

interface Props {
  onCapture: () => void;
  disabled?: boolean;
  ready?: boolean;
}

export function CaptureButton({ onCapture, disabled, ready }: Props) {
  return (
    <button
      type="button"
      onClick={onCapture}
      disabled={disabled}
      aria-label="Fotoğraf çek"
      className="relative h-20 w-20 rounded-full border-4 border-white/80 bg-white/10 backdrop-blur-sm active:scale-95 transition disabled:opacity-40"
    >
      <span
        className={`absolute inset-2 rounded-full transition ${
          ready ? "bg-emerald-400" : "bg-white"
        }`}
      />
    </button>
  );
}
