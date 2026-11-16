import type { Mode } from "./types";

export interface ActiveTrip {
  id: string;
  lat: number;
  lng: number;
  startLat: number;
  startLng: number;
  startDistanceM: number;
  radiusM?: number;
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

export interface HistoryEntry {
  id: string;
  at: string;
  arrived: boolean;
  distanceM: number;
  mode: Mode;
}

const HISTORY_KEY = "getlost.history";

/** Odhalená místa (došel nebo vzdal), nejnovější první. */
export function loadHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]") as HistoryEntry[];
  } catch {
    return [];
  }
}

export function addHistory(entry: Omit<HistoryEntry, "at">) {
  try {
    const history = loadHistory();
    history.unshift({ ...entry, at: new Date().toISOString() });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 300)));
  } catch {}
}
