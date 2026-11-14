import type { Mode } from "./types";

export interface ActiveTrip {
  id: string;
  lat: number;
  lng: number;
  startLat: number;
  startLng: number;
  startDistanceM: number;
  mode: Mode;
  demo: boolean;
  stretched: boolean;
}

const KEY = "getlost.trip";
const SEEN_KEY = "getlost.seen";
let memory: ActiveTrip | null = null;

export function saveTrip(trip: ActiveTrip) {
  memory = trip;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(trip));
  } catch {}
}

export function loadTrip(): ActiveTrip | null {
  if (memory) return memory;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) memory = JSON.parse(raw) as ActiveTrip;
  } catch {}
  return memory;
}

export function clearTrip() {
  memory = null;
  try {
    sessionStorage.removeItem(KEY);
  } catch {}
}

/** Místa, kde už uživatel byl, aby se neopakovala. */
export function loadSeen(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function markSeen(id: string) {
  try {
    const seen = loadSeen().filter((x) => x !== id);
    seen.push(id);
    localStorage.setItem(SEEN_KEY, JSON.stringify(seen.slice(-200)));
  } catch {}
}
