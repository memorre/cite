import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep pdf-parse (pdfjs-dist + @napi-rs/canvas) out of the Turbopack bundle.
  // Bundled, it loses its worker file and native canvas polyfill on Vercel,
  // and /api/upload crashes at import with "DOMMatrix is not defined".
  serverExternalPackages: ["pdf-parse", "@napi-rs/canvas"],
};

export default nextConfig;
