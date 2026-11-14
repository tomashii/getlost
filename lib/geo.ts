import type { Mode } from "./types";

const R = 6371000;
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/** Vzdálenost vzdušnou čarou v metrech. */
export function distanceM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Azimut z bodu 1 do bodu 2 ve stupních (0 = sever, po směru hodin). */
export function bearingDeg(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const y = Math.sin(rad(lng2 - lng1)) * Math.cos(rad(lat2));
  const x =
    Math.cos(rad(lat1)) * Math.sin(rad(lat2)) -
    Math.sin(rad(lat1)) * Math.cos(rad(lat2)) * Math.cos(rad(lng2 - lng1));
  return (deg(Math.atan2(y, x)) + 360) % 360;
}

/** Průměrná rychlost v km/h včetně čekání a zastávek. */
const SPEED_KMH: Record<Mode, number> = { walk: 4.5, bike: 14, transit: 16, car: 30 };

/**
 * Pásmo vzdálenosti (vzdušnou čarou) pro daný čas.
 * Zhruba 40 % času je cesta tam, zbytek je pobyt na místě a cesta zpět.
 * Dělíme 1,3, protože skutečná trasa je delší než vzdušná čára.
 */
export function distanceBandM(mode: Mode, minutes: number): { min: number; max: number } {
  const max = ((SPEED_KMH[mode] * (minutes / 60) * 0.4) / 1.3) * 1000;
  return { min: max * 0.3, max };
}

export function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m / 10) * 10} m`;
  return `${(m / 1000).toFixed(1).replace(".", ",")} km`;
}
