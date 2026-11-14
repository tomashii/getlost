import seed from "@/data/places.json";
import { distanceBandM, distanceM } from "./geo";
import { getSupabase } from "./supabase";
import type { Category, Mode, Place, TripTarget } from "./types";

const COLUMNS = "id,name,category,lat,lng,description,tip";

const localPlaces: Place[] = (seed as Array<Omit<Place, "id"> & { slug: string }>).map((p) => ({
  id: p.slug,
  name: p.name,
  category: p.category,
  lat: p.lat,
  lng: p.lng,
  description: p.description,
  tip: p.tip ?? null,
}));

/** Schválená místa. Ze Supabase, pokud je nastavený, jinak z data/places.json. */
export async function listPlaces(): Promise<Place[]> {
  const supabase = getSupabase();
  if (!supabase) return localPlaces;
  const { data, error } = await supabase.from("places").select(COLUMNS).eq("status", "approved");
  if (error) throw new Error(error.message);
  return (data ?? []) as Place[];
}

export async function getPlace(id: string): Promise<Place | null> {
  const supabase = getSupabase();
  if (!supabase) return localPlaces.find((p) => p.id === id) ?? null;
  const { data, error } = await supabase
    .from("places")
    .select(COLUMNS)
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle();
  // 22P02 = id není platné UUID, tedy místo neexistuje.
  if (error?.code === "22P02") return null;
  if (error) throw new Error(error.message);
  return (data as Place | null) ?? null;
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

  let chosen: { p: Place; d: number };
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
      stretched,
    },
  };
}
