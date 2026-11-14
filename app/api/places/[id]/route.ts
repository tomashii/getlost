import { NextResponse } from "next/server";
import { getPlace } from "@/lib/places";
import { getSupabase } from "@/lib/supabase";

/** Odhalení cíle: plné informace o místě. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const place = await getPlace(id);
    if (!place) return NextResponse.json({ error: "Místo neexistuje." }, { status: 404 });
    return NextResponse.json(place);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Něco se pokazilo, zkus to znovu." }, { status: 500 });
  }
}

/** Lajk místa. Jedno zařízení může dát jeden lajk. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const deviceId = typeof body?.deviceId === "string" ? body.deviceId.slice(0, 64) : "";
  const supabase = getSupabase();
  if (!supabase || !deviceId) return NextResponse.json({ saved: false });
  const { error } = await supabase.from("place_likes").insert({ place_id: id, device_id: deviceId });
  // 23505 = už lajknuto, to není chyba.
  if (error && error.code !== "23505") return NextResponse.json({ saved: false });
  return NextResponse.json({ saved: true });
}
