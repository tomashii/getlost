"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { Marker } from "@/components/marker";
import { CATEGORY_LABEL, type Category } from "@/lib/types";

const CATEGORIES = Object.keys(CATEGORY_LABEL) as Category[];

export default function Add() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tip, setTip] = useState("");
  const [category, setCategory] = useState<Category>("hidden");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function locate() {
    setError(null);
    if (!("geolocation" in navigator)) {
      setError("Tenhle prohlížeč neumí zjistit polohu.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setCoords({ lat: p.coords.latitude, lng: p.coords.longitude });
        setLocating(false);
      },
      () => {
        setError("Nepodařilo se zjistit polohu. Povol ji v prohlížeči.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!coords) {
      setError("Nejdřív ulož polohu místa.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, tip, category, ...coords }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Místo se nepodařilo uložit.");
      else setDone(true);
    } catch {
      setError("Místo se nepodařilo uložit.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <main className="screen">
        <div className="spacer" />
        <h1 className="display l">Díky, máme to</h1>
        <p className="lede">Místo se objeví v appce, jakmile ho schválíme.</p>
        <div className="spacer" />
        <Link href="/profile" className="btn">
          Hotovo
        </Link>
      </main>
    );
  }

  return (
    <main className="screen">
      <div className="nav">
        <Link href="/profile"><Icon name="back" />Zpět</Link>
      </div>
      <h1 className="display l">Přidat místo</h1>
      <p className="lede" style={{ marginBottom: 22 }}>Stůj přímo na místě, uložíme jeho polohu z tvého telefonu.</p>

      <form className="stack" onSubmit={submit} style={{ flex: 1 }}>
        <label className="field">
          <span>Název</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required />
        </label>
        <label className="field">
          <span>Proč sem jít</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={400} required />
        </label>
        <label className="field">
          <span>Tip (nepovinné)</span>
          <input value={tip} onChange={(e) => setTip(e.target.value)} maxLength={200} />
        </label>

        <div className="label" style={{ margin: "12px 0 0" }}>Kategorie</div>
        <div className="chips">
          {CATEGORIES.map((c) => (
            <button key={c} type="button" className="chip" aria-pressed={category === c} onClick={() => setCategory(c)}>
              <Marker category={c} />
              {CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>

        <button type="button" className="btn ghost" onClick={locate} disabled={locating} style={{ marginTop: 10 }}>
          <Icon name={coords ? "check" : "pin"} size={20} />
          {locating ? "Zjišťuji polohu…" : coords ? "Poloha uložena" : "Uložit moji polohu"}
        </button>

        <div className="spacer" />
        {error && <div className="notice error" role="alert">{error}</div>}
        <button type="submit" className="btn" disabled={busy}>
          {busy ? "Odesílám…" : "Odeslat ke schválení"}
        </button>
      </form>
    </main>
  );
}
