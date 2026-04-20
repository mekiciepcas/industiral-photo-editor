import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  cacheOnNavigation: true,
});

const nextConfig: NextConfig = {
  // Allow the bundler to resolve the UpscalerJS subpath exports cleanly.
  transpilePackages: ["upscaler", "@upscalerjs/esrgan-slim"],
};

export default withSerwist(nextConfig);
