"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { CATEGORY_COLOR, PlacesMap } from "@/components/places-map";
import { loadHistory, type HistoryEntry } from "@/lib/trip-store";
import { CATEGORY_LABEL, type Place } from "@/lib/types";

const DATE = new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "numeric", year: "numeric" });

export default function Me() {
  const [history, setHistory] = useState<HistoryEntry[] | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    const h = loadHistory();
    setHistory(h);
    const ids = [...new Set(h.map((x) => x.id))];
    if (ids.length === 0) return;
    fetch(`/api/places?ids=${ids.map(encodeURIComponent).join(",")}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: Place[]) => setPlaces(data))
      .catch(() => setError(true));
  }, []);

  const byId = useMemo(() => new Map(places.map((p) => [p.id, p])), [places]);
  const rows = (history ?? []).filter((h) => byId.has(h.id));
  const arrivedCount = (history ?? []).filter((h) => h.arrived).length;
  const km = (history ?? []).filter((h) => h.arrived).reduce((sum, h) => sum + h.distanceM, 0) / 1000;

  return (
    <main className="screen">
      <div className="nav">
        <Link href="/"><Icon name="back" />Zpět</Link>
      </div>
      <h1 className="large-title">Moje místa</h1>
      <p className="subtitle">Všechno, co jsi už odhalil.</p>

      {history === null ? (
        <div className="spinner" />
      ) : history.length === 0 ? (
        <>
          <div className="spacer" />
          <div className="empty">
            <span className="icon-tile" style={{ width: 56, height: 56, borderRadius: 18 }}>
              <Icon name="map" size={30} />
            </span>
            <strong>Zatím tu nic není</strong>
            <p>Po prvním výletu se tu objeví mapa míst, kam tě Get Lost zavedl.</p>
          </div>
          <div className="spacer" />
          <Link href="/go" className="btn">
            Ztratit se
          </Link>
        </>
      ) : (
        <>
          <div className="stats">
            <div className="card">
              <strong>{history.length}</strong>
              <span>výletů</span>
            </div>
            <div className="card">
              <strong>{arrivedCount}</strong>
              <span>došel jsem</span>
            </div>
            <div className="card">
              <strong>{km.toFixed(1).replace(".", ",")}</strong>
              <span>km k cíli</span>
            </div>
          </div>

          {error && <div className="notice error" role="alert">Místa se nepodařilo načíst.</div>}
          {places.length > 0 && <PlacesMap places={places} />}

          <div className="list" style={{ marginTop: 12 }}>
            {rows.map((h) => {
              const p = byId.get(h.id)!;
              return (
                <Link key={`${h.id}-${h.at}`} href={`/reveal/${h.id}`} className="list-row">
                  <span className="icon-tile" style={{ background: CATEGORY_COLOR[p.category], color: "#fff" }}>
                    <Icon name={p.category} size={20} />
                  </span>
                  <span className="grow">
                    {p.name}
                    <small>
                      {CATEGORY_LABEL[p.category]} · {DATE.format(new Date(h.at))} · {h.arrived ? "došel jsem" : "vzdal jsem to"}
                    </small>
                  </span>
                  <span className="chev"><Icon name="chevron" size={18} /></span>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}
