"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/icons";
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
        <div className="empty">
          <span className="glyph round big">
            <Icon name="check" size={26} />
          </span>
          <h1 className="title-1" style={{ marginTop: 10 }}>Díky, máme to</h1>
          <p>Místo se objeví v appce, jakmile ho schválíme.</p>
        </div>
        <Link href="/profile" className="btn">
          Hotovo
        </Link>
      </main>
    );
  }

  return (
    <main className="screen">
      <div className="nav">
        <Link href="/profile" className="nav-link">
          <Icon name="back" />
          Profil
        </Link>
      </div>
      <h1 className="large-title">Přidat místo</h1>

      <form onSubmit={submit} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div className="group" style={{ marginTop: 16 }}>
          <label className="cell">
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required placeholder="Název" aria-label="Název" />
          </label>
          <label className="cell">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={400} required placeholder="Proč sem jít" aria-label="Proč sem jít" />
          </label>
          <label className="cell">
            <input value={tip} onChange={(e) => setTip(e.target.value)} maxLength={200} placeholder="Tip (nepovinné)" aria-label="Tip" />
          </label>
        </div>

        <h2 className="section-header">Kategorie</h2>
        <div className="chips" style={{ padding: "0 4px" }}>
          {CATEGORIES.map((c) => (
            <button key={c} type="button" className="chip" aria-pressed={category === c} onClick={() => setCategory(c)}>
              <span className={`dot ${c}`} />
              {CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>

        <h2 className="section-header">Poloha</h2>
        <div className="group">
          <button type="button" className="cell" onClick={locate} disabled={locating} style={{ color: "var(--tint)" }}>
            <Icon name={coords ? "check" : "location"} size={20} />
            <span className="grow">{locating ? "Zjišťuji polohu…" : coords ? "Poloha uložena" : "Použít moji polohu"}</span>
          </button>
        </div>
        <p className="section-footer">Stůj přímo na místě, uložíme jeho polohu z tvého telefonu.</p>

        <div className="spacer" style={{ minHeight: 20 }} />
        <div className="stack">
          {error && <div className="notice error" role="alert">{error}</div>}
          <button type="submit" className="btn" disabled={busy}>
            {busy ? "Odesílám…" : "Odeslat ke schválení"}
          </button>
        </div>
      </form>
    </main>
  );
}
