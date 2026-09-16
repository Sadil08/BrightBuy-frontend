import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces .next/standalone/server.js — a minimal, self-contained server that doesn't need the
  // full node_modules tree at runtime. This is what the Dockerfile's runtime stage copies into
  // the image (specs/global/12_DEVOPS_CICD.md §1.2). Note this doesn't include public/ or
  // .next/static automatically — the Dockerfile copies those in separately.
  output: "standalone",
};

export default nextConfig;
