import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Get Lost",
    short_name: "Get Lost",
    description: "Nevíš kam? Nech se vést na místo, které neznáš.",
    start_url: "/",
    display: "standalone",
    background_color: "#0e4b36",
    theme_color: "#0e4b36",
    icons: [
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
