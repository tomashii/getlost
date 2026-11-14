"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import type { Category, Place } from "@/lib/types";

/** Podkladová mapa: OpenFreeMap (zdarma, bez klíče), data OpenStreetMap. */
const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

export const CATEGORY_COLOR: Record<Category, string> = {
  nature: "#1c8a4c",
  view: "#2a6fd0",
  culture: "#cf7a14",
  hidden: "#6a48cf",
  chill: "#df5a3c",
};

/** Mapa s body míst. Ukazuje jen místa, která už uživatel odhalil. */
export function PlacesMap({ places, height = 280 }: { places: Place[]; height?: number }) {
  const container = useRef<HTMLDivElement>(null);
  const key = places.map((p) => p.id).join(",");

  useEffect(() => {
    if (!container.current || places.length === 0) return;
    let cancelled = false;
    let cleanup = () => {};

    import("maplibre-gl").then((maplibregl) => {
      if (cancelled || !container.current) return;
      maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");
      const map = new maplibregl.Map({
        container: container.current,
        style: STYLE_URL,
        center: [places[0].lng, places[0].lat],
        zoom: 14,
        attributionControl: { compact: true },
        dragRotate: false,
        cooperativeGestures: places.length === 1,
      });
      map.touchZoomRotate.disableRotation();
      // Zdroje mapy nech sbalené pod tlačítkem (i), ať nezakrývají mapu.
      map.once("load", () => container.current?.querySelector(".maplibregl-ctrl-attrib")?.classList.remove("maplibregl-compact-show"));

      for (const p of places) {
        const el = document.createElement("div");
        el.className = "map-pin";
        el.style.background = CATEGORY_COLOR[p.category];
        el.title = p.name;
        new maplibregl.Marker({ element: el })
          .setLngLat([p.lng, p.lat])
          .setPopup(new maplibregl.Popup({ offset: 14, closeButton: false }).setText(p.name))
          .addTo(map);
      }

      if (places.length > 1) {
        const bounds = new maplibregl.LngLatBounds();
        places.forEach((p) => bounds.extend([p.lng, p.lat]));
        map.fitBounds(bounds, { padding: 48, maxZoom: 15, animate: false });
      }
      cleanup = () => map.remove();
    });

    return () => {
      cancelled = true;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return <div ref={container} className="map" style={{ height }} role="img" aria-label="Mapa míst" />;
}
