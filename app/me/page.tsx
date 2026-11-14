"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { Marker } from "@/components/marker";
import { PlacesMap } from "@/components/places-map";
import { TabBar } from "@/components/tab-bar";
import { loadHistory, type HistoryEntry } from "@/lib/trip-store";
import type { Place } from "@/lib/types";

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

  return (
    <>
      <main className="screen has-tabs">
        <h1 className="display l" style={{ marginTop: 20 }}>Moje místa</h1>

        {history === null ? (
          <div className="spinner" />
        ) : history.length === 0 ? (
          <div className="empty" style={{ marginTop: 14 }}>
            <p className="lede">Zatím tu nic není. Po prvním výletu se tu objeví mapa míst, kam tě Get Lost zavedl.</p>
            <Link href="/go" className="btn" style={{ marginTop: 26 }}>
              Ztratit se
            </Link>
          </div>
        ) : (
          <>
            <p className="lede" style={{ marginBottom: 20 }}>Všechno, co jsi už odhalil.</p>
            {error && <div className="notice error" role="alert">Místa se nepodařilo načíst.</div>}
            {places.length > 0 && <PlacesMap places={places} />}
            <div style={{ marginTop: 20 }}>
              {rows.map((h) => {
                const p = byId.get(h.id)!;
                return (
                  <Link key={`${h.id}-${h.at}`} href={`/reveal/${h.id}`} className="list-row">
                    <Marker category={p.category} />
                    <span className="grow">
                      {p.name}
                      <small>
                        {DATE.format(new Date(h.at))}, {h.arrived ? "došel jsem" : "vzdal jsem to"}
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
      <TabBar />
    </>
  );
}
