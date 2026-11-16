export type Mode = "walk" | "bike" | "transit" | "car";
export type Category = "nature" | "view" | "culture" | "hidden" | "chill" | "food";

export interface Place {
  id: string;
  name: string;
  category: Category;
  lat: number;
  lng: number;
  description: string;
  tip: string | null;
}

/** Co dostane klient při startu výletu: souřadnice ano, název ne. */
export interface TripTarget {
  id: string;
  lat: number;
  lng: number;
  distanceM: number;
  /** Do jaké vzdálenosti se cíl počítá jako dosažený. */
  radiusM: number;
  stretched: boolean;
}

export const MODE_LABEL: Record<Mode, string> = {
  walk: "Pěšky",
  bike: "Kolo",
  transit: "MHD",
  car: "Auto",
};

export const CATEGORY_LABEL: Record<Category, string> = {
  nature: "Příroda",
  view: "Výhled",
  culture: "Kultura",
  hidden: "Zákoutí",
  chill: "Pohoda",
  food: "Jídlo a pití",
};
