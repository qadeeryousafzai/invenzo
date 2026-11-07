import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Invenzo — Smarter Inventory",
    short_name: "Invenzo",
    description: "A secure workspace for modern inventory teams.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f6f9fc",
    theme_color: "#176b87",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/invenzo-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
