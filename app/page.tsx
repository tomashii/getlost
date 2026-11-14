"use client";

import Link from "next/link";
import { useState } from "react";
import { HowSheet } from "@/components/how-sheet";
import { Icon } from "@/components/icons";

export default function Home() {
  const [how, setHow] = useState(false);
  return (
    <main className="screen">
      <div className="home-hero">
        <div className="wordmark">GET LOST</div>
        <div>
          <h1 className="large-title">Nevíš kam?</h1>
          <p className="subtitle" style={{ margin: 0 }}>
            Nech se vést. Cíl uvidíš, až tam budeš.
          </p>
        </div>
        <Link href="/go" className="go-button">
          Ztratit se
        </Link>
      </div>

      <div className="list">
        <button type="button" className="list-row" onClick={() => setHow(true)}>
          <span className="icon-tile"><Icon name="info" /></span>
          <span className="grow">Jak to funguje</span>
          <span className="chev"><Icon name="chevron" size={18} /></span>
        </button>
        <Link href="/me" className="list-row">
          <span className="icon-tile"><Icon name="map" /></span>
          <span className="grow">Moje místa</span>
          <span className="chev"><Icon name="chevron" size={18} /></span>
        </Link>
        <Link href="/add" className="list-row">
          <span className="icon-tile"><Icon name="plus" /></span>
          <span className="grow">Přidat vlastní místo</span>
          <span className="chev"><Icon name="chevron" size={18} /></span>
        </Link>
      </div>

      <HowSheet open={how} onClose={() => setHow(false)} />
    </main>
  );
}
