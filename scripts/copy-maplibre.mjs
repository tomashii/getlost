// Zkopíruje worker MapLibre do public/, aby ho prohlížeč načetl z vlastní adresy.
// Spouští se automaticky před "npm run dev" a "npm run build".
import { copyFileSync, mkdirSync } from "node:fs";

mkdirSync(new URL("../public/", import.meta.url), { recursive: true });
copyFileSync(
  new URL("../node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url),
  new URL("../public/maplibre-gl-worker.mjs", import.meta.url),
);
