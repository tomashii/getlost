# Get Lost

Webová appka (Next.js + Supabase), která tě šipkou dovede na místo, které neznáš. Plán a nápady jsou v [PLAN.md](PLAN.md).

## Spuštění na počítači

Potřebuješ [Node.js](https://nodejs.org) 20 nebo novější.

```bash
npm install
npm run dev
```

Otevři http://localhost:3000. Bez Supabase appka čte místa z `data/places.json`. Na počítači bez GPS klepni na "Vyrazit" a potom na "Vyzkoušet demo z centra Prahy".

Kompas a GPS fungují jen přes HTTPS, takže na telefonu testuj až nasazenou verzi na Vercelu.

## Supabase

1. Na [supabase.com](https://supabase.com) založ projekt.
2. V **SQL Editoru** spusť obsah `supabase/schema.sql`, potom `supabase/seed.sql`.
3. V **Project Settings → API** zkopíruj Project URL a anon (publishable) klíč.
4. Zkopíruj `.env.example` jako `.env.local` a hodnoty doplň.

Navržená místa od uživatelů mají `status = pending`. Schválíš je v Table Editoru změnou na `approved`.

Když upravíš `data/places.json`, vygeneruj nový seed příkazem `npm run seed:sql` a spusť ho v SQL Editoru znovu.

## Vercel

1. Nahraj složku na GitHub (`git init`, commit, push).
2. Na [vercel.com](https://vercel.com) dej **Add New → Project** a vyber repozitář.
3. V **Environment Variables** přidej `NEXT_PUBLIC_SUPABASE_URL` a `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Deploy.
