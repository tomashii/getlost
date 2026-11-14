import type { Metadata, Viewport } from "next";
import "@fontsource-variable/sofia-sans/index.css";
import "@fontsource-variable/sofia-sans-extra-condensed/index.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Get Lost",
  description: "Nevíš kam? Nech se vést na místo, které neznáš.",
  appleWebApp: { capable: true, title: "Get Lost", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f6f1" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1f17" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body>{children}</body>
    </html>
  );
}
