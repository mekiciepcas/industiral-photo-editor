import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UPS Photo Studio",
  description:
    "Endüstriyel cihazlar (UPS, inverter, rectifier, rack) için profesyonel fotoğraf çekim rehberi ve AI tabanlı görüntü iyileştirme.",
  applicationName: "UPS Photo Studio",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "UPS Photo Studio",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} h-full min-h-[100dvh] antialiased`}
    >
      <body className="flex min-h-[100dvh] flex-col bg-neutral-950 text-neutral-100">
        {children}
      </body>
    </html>
  );
}
