"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { HowSheet } from "@/components/how-sheet";
import { Icon } from "@/components/icons";
import { loadSeen, saveTrip } from "@/lib/trip-store";
import { CATEGORY_LABEL, MODE_LABEL, type Category, type Mode, type TripTarget } from "@/lib/types";

const MODES: Mode[] = ["walk", "bike", "transit", "car"];
const TIMES = [
  { minutes: 30, label: "30 min" },
  { minutes: 60, label: "1 h" },
  { minutes: 120, label: "2 h" },
  { minutes: 240, label: "Půl dne" },
];
const CATEGORIES = Object.keys(CATEGORY_LABEL) as Category[];

/** Staroměstské náměstí: start pro demo, když uživatel není v Praze nebo nemá GPS. */
const DEMO_START = { lat: 50.0875, lng: 14.4213 };

function getPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) return reject(new Error("no-geolocation"));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      reject,
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );
  });
}

export default function Go() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("walk");
  const [minutes, setMinutes] = useState(60);
  const [category, setCategory] = useState<Category | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offerDemo, setOfferDemo] = useState(false);
  const [intro, setIntro] = useState(false);

  /** Před úplně prvním výletem ukaž, jak to funguje. */
  function begin() {
    let seenIntro = false;
    try {
      seenIntro = localStorage.getItem("getlost.intro") === "1";
    } catch {}
    if (seenIntro) start(false);
    else setIntro(true);
  }

  function closeIntro() {
    try {
      localStorage.setItem("getlost.intro", "1");
    } catch {}
    setIntro(false);
    start(false);
  }

  async function start(demo: boolean) {
    setBusy(true);
    setError(null);
    setOfferDemo(false);
    try {
      let pos = DEMO_START;
      if (!demo) {
        try {
          pos = await getPosition();
        } catch {
          setError("Nepodařilo se zjistit tvoji polohu. Povol ji v prohlížeči, nebo si appku vyzkoušej v demo režimu.");
          setOfferDemo(true);
          return;
        }
      }
      const res = await fetch("/api/trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...pos, mode, minutes, category, exclude: loadSeen() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Něco se pokazilo, zkus to znovu.");
        setOfferDemo(data.reason === "too_far" && !demo);
        return;
      }
      const target = data as TripTarget;
      saveTrip({
        id: target.id,
        lat: target.lat,
        lng: target.lng,
        startLat: pos.lat,
        startLng: pos.lng,
        startDistanceM: target.distanceM,
        mode,
        demo,
        stretched: target.stretched,
      });
      router.push("/trip");
    } catch {
      setError("Něco se pokazilo, zkus to znovu.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="screen">
      <div className="nav">
        <Link href="/"><Icon name="back" />Zpět</Link>
      </div>
      <h1 className="large-title">Jak se chceš ztratit?</h1>
      <p className="subtitle">Vybereme místo, které stihneš. Kam jdeš, ti neřekneme.</p>

      <div className="section-label">Doprava</div>
      <div className="segmented with-icons">
        {MODES.map((m) => (
          <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)}>
            <Icon name={m} size={24} />
            {MODE_LABEL[m]}
          </button>
        ))}
      </div>

      <div className="section-label">Kolik máš času</div>
      <div className="segmented">
        {TIMES.map((t) => (
          <button key={t.minutes} type="button" aria-pressed={minutes === t.minutes} onClick={() => setMinutes(t.minutes)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="section-label">Nálada</div>
      <div className="chips">
        <button type="button" className="chip" aria-pressed={category === null} onClick={() => setCategory(null)}>
          Cokoliv
        </button>
        {CATEGORIES.map((c) => (
          <button key={c} type="button" className="chip" aria-pressed={category === c} onClick={() => setCategory(c)}>
            {CATEGORY_LABEL[c]}
          </button>
        ))}
      </div>

      <div className="spacer" />

      <div className="stack" style={{ marginTop: 24 }}>
        {error && <div className="notice error" role="alert">{error}</div>}
        {offerDemo && (
          <button type="button" className="btn secondary" disabled={busy} onClick={() => start(true)}>
            Vyzkoušet demo z centra Prahy
          </button>
        )}
        <button type="button" className="btn" disabled={busy} onClick={begin}>
          {busy ? "Hledám místo…" : "Vyrazit"}
        </button>
      </div>
      <HowSheet open={intro} onClose={closeIntro} cta="Jdu na to" />
    </main>
  );
}
