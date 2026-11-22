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
    background_color: "#F0F5FF",
    theme_color: "#3C60FD",
    icons: [
      { src: "/logo/logo.png", sizes: "2000x2000", type: "image/png", purpose: "any" },
      { src: "/logo/pwa-icon.png", sizes: "2000x2000", type: "image/png", purpose: "any" },
      { src: "/logo/Favicon.png", sizes: "2000x2000", type: "image/png", purpose: "maskable" },
    ],
  };
}
