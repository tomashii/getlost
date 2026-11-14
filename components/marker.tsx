import type { Category } from "@/lib/types";

/** Turistická značka: tři pruhy, prostřední v barvě kategorie. */
export function Marker({ category, className = "" }: { category?: Category; className?: string }) {
  return <span className={`marker ${category ?? ""} ${className}`} aria-hidden="true" />;
}
