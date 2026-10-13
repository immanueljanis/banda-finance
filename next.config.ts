import type { NextConfig } from "next";
const config: NextConfig = {
  distDir: process.env.BANDA_BUILD_DIR || ".next",
  outputFileTracingRoot: process.cwd(),
  devIndicators: false,
};
export default config;
