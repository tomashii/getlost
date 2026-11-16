"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import type { Place } from "@/lib/types";

/** Podkladová mapa: OpenFreeMap (zdarma, bez klíče), data OpenStreetMap. */
const STYLE_LIGHT = "https://tiles.openfreemap.org/styles/positron";
const STYLE_DARK = "https://tiles.openfreemap.org/styles/dark";

const PRAGUE: [number, number] = [14.4208, 50.0835];

interface Props {
  /** Místa k zobrazení. Ukazuj jen ta, která už uživatel odhalil. */
  places?: Place[];
  /** Zobrazit modrou tečku s polohou uživatele (jen když už polohu povolil). */
  showUser?: boolean;
  interactive?: boolean;
  className?: string;
  height?: number;
}

export function PlacesMap({ places = [], showUser = false, interactive = true, className = "", height }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const key = places.map((p) => p.id).join(",");

  useEffect(() => {
    if (!container.current) return;
    let cancelled = false;
    let cleanup = () => {};

    import("maplibre-gl").then((maplibregl) => {
      if (cancelled || !container.current) return;
      maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");
      const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const map = new maplibregl.Map({
        container: container.current,
        style: dark ? STYLE_DARK : STYLE_LIGHT,
        center: places[0] ? [places[0].lng, places[0].lat] : PRAGUE,
        zoom: places[0] ? 15 : 12.2,
        attributionControl: { compact: true },
        interactive,
        dragRotate: false,
        cooperativeGestures: interactive && places.length === 1,
      });
      map.touchZoomRotate.disableRotation();
      // Zdroje mapy nech sbalené pod tlačítkem (i), ať nezakrývají mapu.
      map.once("load", () =>
        container.current?.querySelector(".maplibregl-ctrl-attrib")?.classList.remove("maplibregl-compact-show"),
      );

      for (const p of places) {
        const el = document.createElement("div");
        el.className = `map-pin ${p.category}`;
        el.title = p.name;
        new maplibregl.Marker({ element: el })
          .setLngLat([p.lng, p.lat])
          .setPopup(new maplibregl.Popup({ offset: 16, closeButton: false }).setText(p.name))
          .addTo(map);
      }
      if (places.length > 1) {
        const bounds = new maplibregl.LngLatBounds();
        places.forEach((p) => bounds.extend([p.lng, p.lat]));
        map.fitBounds(bounds, { padding: 48, maxZoom: 15, animate: false });
      }

      // Polohu čteme jen tehdy, když ji uživatel už dřív povolil, ať mapa sama nevyvolá dotaz.
      if (showUser && "permissions" in navigator && "geolocation" in navigator) {
        navigator.permissions
          .query({ name: "geolocation" })
          .then((status) => {
            if (status.state !== "granted" || cancelled) return;
            navigator.geolocation.getCurrentPosition((pos) => {
              if (cancelled) return;
              const here: [number, number] = [pos.coords.longitude, pos.coords.latitude];
              const el = document.createElement("div");
              el.className = "user-dot";
              new maplibregl.Marker({ element: el }).setLngLat(here).addTo(map);
              map.jumpTo({ center: here, zoom: 14 });
            });
          })
          .catch(() => {});
      }
      cleanup = () => map.remove();
    });

    return () => {
      cancelled = true;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, showUser, interactive]);

  return <div ref={container} className={`map ${className}`} style={height ? { height } : undefined} role="img" aria-label="Mapa" />;
}
