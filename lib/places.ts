import seed from "@/data/places.json";
import { distanceBandM, distanceM } from "./geo";
import { getSupabase } from "./supabase";
import type { Category, Mode, Place, TripTarget } from "./types";

const COLUMNS = "id,name,category,lat,lng,description,tip,radius_m";

const LEGACY_COLUMNS = "id,name,category,lat,lng,description,tip";

type Row = Place & { radius_m?: number };

const localPlaces: Row[] = (seed as Array<Omit<Place, "id"> & { slug: string; radius?: number }>).map((p) => ({
  id: p.slug,
  name: p.name,
  category: p.category,
  lat: p.lat,
  lng: p.lng,
  description: p.description,
  tip: p.tip ?? null,
  radius_m: p.radius ?? 70,
}));

/** Schválená místa. Ze Supabase, pokud je nastavený, jinak z data/places.json. */
export async function listPlaces(): Promise<Row[]> {
  const supabase = getSupabase();
  if (!supabase) return localPlaces;
  const full = await supabase.from("places").select(COLUMNS).eq("status", "approved");
  if (!full.error) return (full.data ?? []) as Row[];
  // 42703 = databáze ještě nemá sloupec radius_m (starší schéma). Načti bez něj.
  if (full.error.code !== "42703") throw new Error(full.error.message);
  const legacy = await supabase.from("places").select(LEGACY_COLUMNS).eq("status", "approved");
  if (legacy.error) throw new Error(legacy.error.message);
  return (legacy.data ?? []) as Row[];
}

export async function getPlace(id: string): Promise<Place | null> {
  const supabase = getSupabase();
  if (!supabase) return localPlaces.find((p) => p.id === id) ?? null;
  const { data, error } = await supabase
    .from("places")
    .select(LEGACY_COLUMNS)
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle();
  // 22P02 = id není platné UUID, tedy místo neexistuje.
  if (error?.code === "22P02") return null;
  if (error) throw new Error(error.message);
  return (data as Place | null) ?? null;
}

/** Místa podle id (pro mapu navštívených míst). */
export async function getPlaces(ids: string[]): Promise<Place[]> {
  if (ids.length === 0) return [];
  const supabase = getSupabase();
  if (!supabase) return localPlaces.filter((p) => ids.includes(p.id));
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const valid = ids.filter((id) => uuid.test(id));
  if (valid.length === 0) return [];
  const { data, error } = await supabase.from("places").select(LEGACY_COLUMNS).in("id", valid).eq("status", "approved");
  if (error) throw new Error(error.message);
  return (data ?? []) as Place[];
}

export interface TripRequest {
  lat: number;
  lng: number;
  mode: Mode;
  minutes: number;
  category: Category | null;
  exclude: string[];
}

/** Mimo tuhle vzdálenost od nejbližšího místa výlet nenabízíme. */
const MAX_SERVICE_DISTANCE_M = 40000;

export type TripResult = { ok: true; target: TripTarget } | { ok: false; reason: "too_far" | "empty" };

export async function pickTrip(req: TripRequest): Promise<TripResult> {
  const all = await listPlaces();
  let pool = all.filter((p) => !req.exclude.includes(p.id));
  if (req.category) {
    const byCategory = pool.filter((p) => p.category === req.category);
    if (byCategory.length > 0) pool = byCategory;
  }
  if (pool.length === 0) return { ok: false, reason: "empty" };

  const withDistance = pool.map((p) => ({ p, d: distanceM(req.lat, req.lng, p.lat, p.lng) }));
  const nearest = Math.min(...withDistance.map((x) => x.d));
  if (nearest > MAX_SERVICE_DISTANCE_M) return { ok: false, reason: "too_far" };

  const band = distanceBandM(req.mode, req.minutes);
  const inBand = withDistance.filter((x) => x.d >= band.min && x.d <= band.max);

  let chosen: { p: Row; d: number };
  let stretched = false;
  if (inBand.length > 0) {
    chosen = inBand[Math.floor(Math.random() * inBand.length)];
  } else {
    // Nic v pásmu: vezmi místo nejblíž ideální vzdálenosti (a ta, co jsou podobně daleko).
    const ideal = (band.min + band.max) / 2;
    const off = (x: { d: number }) => Math.abs(x.d - ideal);
    const sorted = [...withDistance].sort((a, b) => off(a) - off(b));
    const closest = sorted.filter((x) => off(x) <= off(sorted[0]) * 1.25).slice(0, 3);
    chosen = closest[Math.floor(Math.random() * closest.length)];
    stretched = chosen.d > band.max;
  }

  return {
    ok: true,
    target: {
      id: chosen.p.id,
      lat: chosen.p.lat,
      lng: chosen.p.lng,
      distanceM: Math.round(chosen.d),
      radiusM: chosen.p.radius_m ?? 70,
      stretched,
    },
  };
}
