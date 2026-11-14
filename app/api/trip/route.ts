import { NextResponse } from "next/server";
import { pickTrip } from "@/lib/places";
import type { Category, Mode } from "@/lib/types";

const MODES: Mode[] = ["walk", "bike", "transit", "car"];
const CATEGORIES: Category[] = ["nature", "view", "culture", "hidden", "chill"];

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const lat = Number(body?.lat);
  const lng = Number(body?.lng);
  const minutes = Number(body?.minutes);
  const mode = body?.mode as Mode;
  if (
    !Number.isFinite(lat) || Math.abs(lat) > 90 ||
    !Number.isFinite(lng) || Math.abs(lng) > 180 ||
    !Number.isFinite(minutes) || minutes < 10 || minutes > 720 ||
    !MODES.includes(mode)
  ) {
    return NextResponse.json({ error: "Neplatný požadavek." }, { status: 400 });
  }
  const category = CATEGORIES.includes(body?.category) ? (body.category as Category) : null;
  const exclude = Array.isArray(body?.exclude) ? body.exclude.filter((x: unknown) => typeof x === "string").slice(0, 200) : [];

  try {
    let result = await pickTrip({ lat, lng, mode, minutes, category, exclude });
    // Když už uživatel viděl všechno, začni znovu od začátku.
    if (!result.ok && result.reason === "empty" && exclude.length > 0) {
      result = await pickTrip({ lat, lng, mode, minutes, category, exclude: [] });
    }
    if (!result.ok) {
      const error =
        result.reason === "too_far"
          ? "Tady zatím žádná místa nemáme. Get Lost teď funguje jen v Praze."
          : "Zatím nemáme žádná místa.";
      return NextResponse.json({ error, reason: result.reason }, { status: 404 });
    }
    return NextResponse.json(result.target);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Něco se pokazilo, zkus to znovu." }, { status: 500 });
  }
}
