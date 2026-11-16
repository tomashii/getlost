# Get Lost: plán

Nudíš se a nevíš kam. Nastavíš dopravu a čas, appka tě vede jen šipkou a vzdáleností. Cíl se dozvíš, až tam dojdeš.

## Rozhodnutí pro první verzi

| Oblast | Rozhodnutí | Proč |
|---|---|---|
| Platforma | Webová appka (PWA) na Next.js, hosting Vercel | Běží hned na iPhonu i Androidu bez App Storu, dá se přidat na plochu |
| Data | Supabase (Postgres), bez přihlašování | Účty nejsou potřeba, dokud se neověří, že výlety lidi baví |
| Navigace | Šipka + vzdálenost vzdušnou čarou, žádná mapa | Mapa s trasou prozradí cíl; šipka je i jednodušší |
| Mapa | Jen u už odhalených míst (MapLibre + OpenFreeMap, zdarma bez klíče) | Nic neprozradí a ukáže, kde už jsi byl |
| Město | Jen Praha, 134 míst v šesti kategoriích včetně tipů místních | Kvalita míst rozhoduje, jestli se uživatel vrátí |
| Jazyk | Čeština | První uživatelé budou z Prahy; angličtina až s druhým městem |
| Vzhled | Čistý Apple styl: systémové písmo, mapa s panelem na úvodu, skleněná lišta záložek, seskupené seznamy, jedna zelená, světlý i tmavý režim | Zadání |

## Co je hotové (v0.1)

- Úvod s jedním tlačítkem "Ztratit se"
- Filtry: doprava (pěšky, kolo, MHD, auto), čas (30 min až půl dne), nálada (5 kategorií)
- Výběr místa podle polohy a času, místa se neopakují
- Navigace šipkou s kompasem, "přihořívá / samá voda", ukazatel postupu
- Odhalení cíle po příchodu do 50 m, nebo po vzdání
- Lajk, sdílení, otevření v mapách
- Návrh vlastního místa (ukládá se ke schválení)
- Moje místa: statistiky, mapa a seznam už odhalených míst (ukládá se v telefonu, bez účtu)
- Malá mapa na obrazovce odhalení
- Spodní lišta záložek: Výlet, Místa, Profil
- Profil: statistiky, odznaky, nastavení
- Hlasové pokyny a vibrace během výletu, displej při výletu nezhasíná
- Demo režim z centra Prahy pro testování na počítači
- Funguje i bez Supabase (čte `data/places.json`)

## Co zatím chybí nebo je zjednodušené

- **Souřadnice jsou dohledané v OpenStreetMap**, ale nikdo je neprošel v terénu. U pár míst (Krymská, Náplavka, vyhlídky ve velkých parcích) je bod odhad v rámci místa. Velké parky a lesy mají větší okruh, ve kterém se cíl počítá jako dosažený.
- **Podniky (kategorie Jídlo a pití) nemají ověřenou otevírací dobu** ani to, že stále fungují.
- **MHD a auto** mají jen šipku vzdušnou čarou. Skutečná navigace krok za krokem bez prozrazení cíle je úkol na verzi 0.3.
- **Lajky** se ukládají, ale nikde se nezobrazují jejich počty.
- **Schvalování míst** je ruční v Supabase (změna `status` na `approved`).
- **Historie výletů je jen v telefonu.** Po smazání dat prohlížeče nebo na jiném zařízení zmizí; trvalá bude až s přihlášením (v0.3).
- **Offline režim** není.

## Roadmapa

### v0.2: ověření nápadu (2–3 týdny)
1. Projít místa v terénu a vyřadit ta, která nefungují
2. Otevírací doby a "jen za světla" u míst, kde to dává smysl
3. Fotka místa na obrazovce odhalení
4. Sdílecí karta do Instagram Stories (obrázek s názvem místa a ušlou vzdáleností)
5. Jednoduchá analytika: kolik výletů začalo, kolik skončilo příchodem, kolik vzdáním
6. Dát 20–30 lidem a sledovat, jestli jdou podruhé

### v0.25: MHD doopravdy
1. Napojit vyhledávač spojení (kandidáti: Golemio/PID otevřená data, Google Routes, Transitous)
2. Výlet MHD ve třech krocích: šipka na zastávku, pokyn "nastup do tramvaje 17 směr X, vystup na 4. zastávce" (bez názvu cílové zastávky to nejde, takže se prozradí jen zastávka, ne cíl), potom šipka k cíli
3. Přepnutí dopravy během výletu

### v0.3: komunita
1. Přihlášení (Supabase Auth: Apple, Google, e-mail)
2. Profil: historie výletů, nachozené kilometry, odznaky (už je máš v návrhu)
3. Místa od uživatelů se schvalovací frontou a nahlašováním
4. Počty lajků a řazení míst podle oblíbenosti
5. Navigace krok za krokem pro auto a MHD (pokyn "za 200 m doleva", bez mapy cíle)

### v0.4: peníze
1. Premium (platby přes Stripe): neomezené výlety, filtry navíc (rozpočet, se psem, rande, s dětmi), tematické výlety
2. Zdarma zůstanou zhruba 3 výlety týdně
3. Partnerská místa: kavárny a podniky jako označený cíl nebo zastávka po cestě
4. První jednání s městskou částí nebo turistickou organizací o sponzorované trase

### Později
- Nativní appka pro iOS (zabalit přes Capacitor, nebo přepsat do React Native). Teprve ta umí navigaci se zamčeným displejem, živé aktivity na zamykací obrazovce a hodinky
- Druhé město a angličtina
- Výlety ve dvou nebo ve skupině (všichni jdou ke stejnému cíli)
- Vícezastávkové výlety ("večer o třech zastávkách")

## Rozvinuté nápady

- **Odznaky jako důvod se vrátit:** první výlet, 10 km, 5 čtvrtí, noční výlet, výlet v dešti.
- **Výzva týdne:** jedno místo, které má týden všichni stejné, a žebříček, kdo došel.
- **Režim rande:** dva lidé, cíl je podnik, appka po příchodu navrhne, co si dát.
- **Tajemství po cestě:** v půlce cesty krátká nápověda ("už vidíš vodu?"), která nezkazí překvapení.
- **Tvůrci míst:** kdo přidá oblíbené místo, vidí, kolik lidí k němu došlo.
- **Obsah pro sítě:** každý výlet je hotový formát videa "appka mě poslala neznámo kam".

## Bezpečnost

- Místa jen na veřejně přístupných pozemcích
- Tlačítko "Vzdát to a prozradit cíl" je vždy po ruce
- Šipka vede vzdušnou čarou, takže uživatel musí cestu volit sám. V appce to chce jasně říct před prvním výletem (zatím chybí)
- Za tmy nenabízet lesy a odlehlá místa (v0.2)

## Technika

```
app/                 obrazovky a API
  page.tsx           úvod
  go/                filtry
  trip/              navigace šipkou
  reveal/[id]/       odhalení cíle
  add/               návrh místa
  api/trip           výběr cíle (vrací souřadnice, ne název)
  api/places         návrh místa, detail, lajk
lib/                 výpočty vzdáleností, výběr místa, Supabase
data/places.json     místa pro Prahu (zdroj pro seed.sql)
supabase/            schema.sql a seed.sql
```

Výběr místa: rychlost podle dopravy × čas × 0,4 (zbytek je pobyt a cesta zpět) dá maximální vzdálenost; místo se losuje z pásma 30–100 % této vzdálenosti. Místa se teď filtrují v kódu, při tisících míst to přejde na PostGIS dotaz.
