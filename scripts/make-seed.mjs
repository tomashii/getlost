// Vygeneruje supabase/seed.sql z data/places.json. Spuštění: npm run seed:sql
import { readFileSync, writeFileSync } from "node:fs";

const places = JSON.parse(readFileSync(new URL("../data/places.json", import.meta.url), "utf8"));
const q = (s) => (s == null ? "null" : `'${String(s).replace(/'/g, "''")}'`);

const rows = places
  .map((p) => `  (${q(p.slug)}, ${q(p.name)}, ${q(p.category)}, ${p.lat}, ${p.lng}, ${q(p.description)}, ${q(p.tip)}, ${p.radius ?? 70}, 'approved')`)
  .join(",\n");

const sql = `-- Vygenerováno z data/places.json (npm run seed:sql). Needituj ručně.
insert into public.places (slug, name, category, lat, lng, description, tip, radius_m, status) values
${rows}
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  lat = excluded.lat,
  lng = excluded.lng,
  description = excluded.description,
  tip = excluded.tip,
  radius_m = excluded.radius_m;
`;

writeFileSync(new URL("../supabase/seed.sql", import.meta.url), sql);
console.log(`seed.sql: ${places.length} míst`);
