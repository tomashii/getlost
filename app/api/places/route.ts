import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import type { Category } from "@/lib/types";

const CATEGORIES: Category[] = ["nature", "view", "culture", "hidden", "chill"];

/** Návrh nového místa od uživatele. Uloží se jako "pending" a čeká na schválení. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  const description = String(body?.description ?? "").trim();
  const tip = String(body?.tip ?? "").trim();
  const lat = Number(body?.lat);
  const lng = Number(body?.lng);
  const category = body?.category as Category;

  if (name.length < 3 || name.length > 80 || description.length < 10 || description.length > 400 || tip.length > 200) {
    return NextResponse.json({ error: "Vyplň název (3–80 znaků) a popis (10–400 znaků)." }, { status: 400 });
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return NextResponse.json({ error: "Chybí poloha místa." }, { status: 400 });
  }
  if (!CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Vyber kategorii." }, { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Přidávání míst zatím není zapnuté (chybí propojení se Supabase)." }, { status: 503 });
  }
  const { error } = await supabase
    .from("places")
    .insert({ name, description, tip: tip || null, lat, lng, category, status: "pending" });
  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Místo se nepodařilo uložit." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
