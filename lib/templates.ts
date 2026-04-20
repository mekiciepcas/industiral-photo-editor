export type DeviceType = "rack" | "tower" | "wall" | "industrial";

export interface DeviceTemplate {
  id: DeviceType;
  name: string;
  description: string;
  /** width / height aspect ratio of the bounding box */
  aspect: number;
  /** Recommended framing fraction of viewport (0-1) */
  fillTarget: number;
  /** Tips shown in the capture overlay */
  tips: string[];
  /**
   * SVG paths describing the silhouette, drawn inside a 100x100 viewBox that
   * will be scaled to the device aspect ratio. Multiple paths allow drawing
   * panels, vents, screens, etc.
   */
  paths: Array<{ d: string; stroke?: string; strokeWidth?: number; fill?: string; dashed?: boolean }>;
}

const STROKE = "currentColor";

export const TEMPLATES: Record<DeviceType, DeviceTemplate> = {
  rack: {
    id: "rack",
    name: "Rack Tipi",
    description: "19\" rack formu, yatay rack UPS / inverter",
    aspect: 16 / 3,
    fillTarget: 0.8,
    tips: [
      "Cihaz ön paneli sensöre tam paralel olmalı.",
      "Silüet kenarları rack kulaklarıyla çakışacak şekilde yaklaşın.",
      "Ön panel LCD ve LED'leri ortalı olsun.",
    ],
    paths: [
      // Outer rack frame
      { d: "M2 10 H98 V90 H2 Z", stroke: STROKE, strokeWidth: 1.2, fill: "none" },
      // Rack ears
      { d: "M2 10 V90 M98 10 V90", stroke: STROKE, strokeWidth: 1.2 },
      // Mounting holes left
      { d: "M4 22 h2 M4 50 h2 M4 78 h2", stroke: STROKE, strokeWidth: 1 },
      // Mounting holes right
      { d: "M94 22 h2 M94 50 h2 M94 78 h2", stroke: STROKE, strokeWidth: 1 },
      // LCD display area
      { d: "M40 35 H60 V65 H40 Z", stroke: STROKE, strokeWidth: 1, fill: "none", dashed: true },
      // Left vent
      { d: "M10 30 H30 V70 H10 Z", stroke: STROKE, strokeWidth: 0.8, fill: "none", dashed: true },
      // Right vent
      { d: "M70 30 H90 V70 H70 Z", stroke: STROKE, strokeWidth: 0.8, fill: "none", dashed: true },
    ],
  },
  tower: {
    id: "tower",
    name: "Dikili Tip",
    description: "Dikey tower UPS / inverter",
    aspect: 1 / 3,
    fillTarget: 0.85,
    tips: [
      "Kamerayı cihaz ortası yüksekliğine getirin.",
      "Tepe ve taban eşit boşluk bıraksın.",
      "Telefon dikey modda tutulmalı (portre).",
    ],
    paths: [
      // Body
      { d: "M10 4 H90 V96 H10 Z", stroke: STROKE, strokeWidth: 1.2, fill: "none" },
      // Top vent
      { d: "M20 8 H80 V18 H20 Z", stroke: STROKE, strokeWidth: 0.8, fill: "none", dashed: true },
      // LCD
      { d: "M30 30 H70 V45 H30 Z", stroke: STROKE, strokeWidth: 1, fill: "none", dashed: true },
      // Controls
      { d: "M40 55 H60 V65 H40 Z", stroke: STROKE, strokeWidth: 0.8, fill: "none", dashed: true },
      // Bottom vent
      { d: "M20 80 H80 V92 H20 Z", stroke: STROKE, strokeWidth: 0.8, fill: "none", dashed: true },
    ],
  },
  wall: {
    id: "wall",
    name: "Duvar Tipi",
    description: "Duvar montajlı kompakt inverter / rectifier",
    aspect: 1,
    fillTarget: 0.78,
    tips: [
      "Düz duvara paralel durun, lens duvara dik olsun.",
      "Gölgelerin yönünü aynı tutmak için yan ışık kullanın.",
      "Cihaz logo ve etiketleri görünür olsun.",
    ],
    paths: [
      // Body
      { d: "M8 8 H92 V92 H8 Z", stroke: STROKE, strokeWidth: 1.2, fill: "none" },
      // Top vent
      { d: "M15 14 H85 V22 H15 Z", stroke: STROKE, strokeWidth: 0.8, fill: "none", dashed: true },
      // LCD
      { d: "M30 35 H70 V55 H30 Z", stroke: STROKE, strokeWidth: 1, fill: "none", dashed: true },
      // Buttons
      { d: "M35 65 h6 M47 65 h6 M59 65 h6", stroke: STROKE, strokeWidth: 1.5 },
      // Bottom connectors
      { d: "M20 82 H80 V88 H20 Z", stroke: STROKE, strokeWidth: 0.8, fill: "none", dashed: true },
    ],
  },
  industrial: {
    id: "industrial",
    name: "Endüstriyel",
    description: "Büyük kabin / endüstriyel rectifier",
    aspect: 4 / 3,
    fillTarget: 0.82,
    tips: [
      "Cihazın tamamı kadrajda olsun, zeminden 20 cm boşluk bırakın.",
      "Kapı menteşeleri her zaman aynı tarafta kalsın.",
      "Nötr (gri veya beyaz) zemin tercih edin.",
    ],
    paths: [
      // Cabinet
      { d: "M6 6 H94 V94 H6 Z", stroke: STROKE, strokeWidth: 1.2, fill: "none" },
      // Door split
      { d: "M50 6 V94", stroke: STROKE, strokeWidth: 1, dashed: true },
      // Handles
      { d: "M46 48 h3 M51 48 h3", stroke: STROKE, strokeWidth: 1.5 },
      // Top LCD
      { d: "M20 14 H45 V24 H20 Z", stroke: STROKE, strokeWidth: 0.8, fill: "none", dashed: true },
      // Vents
      { d: "M60 14 H85 V24 H60 Z", stroke: STROKE, strokeWidth: 0.8, fill: "none", dashed: true },
      { d: "M12 80 H88 V88 H12 Z", stroke: STROKE, strokeWidth: 0.8, fill: "none", dashed: true },
    ],
  },
};

export const TEMPLATE_LIST: DeviceTemplate[] = [
  TEMPLATES.rack,
  TEMPLATES.tower,
  TEMPLATES.wall,
  TEMPLATES.industrial,
];

export function getTemplate(type: string | undefined): DeviceTemplate | undefined {
  if (!type) return undefined;
  if (type in TEMPLATES) return TEMPLATES[type as DeviceType];
  return undefined;
}
