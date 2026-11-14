"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { PlacesMap } from "@/components/places-map";
import { CATEGORY_LABEL, type Place } from "@/lib/types";

function deviceId(): string {
  try {
    let id = localStorage.getItem("getlost.device");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("getlost.device", id);
    }
    return id;
  } catch {
    return "";
  }
}

function likedKey(id: string) {
  return `getlost.liked.${id}`;
}

export default function Reveal() {
  const { id } = useParams<{ id: string }>();
  const [place, setPlace] = useState<Place | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [arrived, setArrived] = useState(false);
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setArrived(new URLSearchParams(window.location.search).get("arrived") === "1");
    try {
      setLiked(localStorage.getItem(likedKey(id)) === "1");
    } catch {}
    fetch(`/api/places/${encodeURIComponent(id)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setPlace(data as Place);
      })
      .catch((e: Error) => setError(e.message || "Místo se nepodařilo načíst."));
  }, [id]);

  function like() {
    if (liked) return;
    setLiked(true);
    try {
      localStorage.setItem(likedKey(id), "1");
    } catch {}
    fetch(`/api/places/${encodeURIComponent(id)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId: deviceId() }),
    }).catch(() => {});
  }

  async function share() {
    if (!place) return;
    const text = `Ztratil jsem se a skončil tady: ${place.name}. Zkus to taky.`;
    const url = window.location.origin;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Get Lost", text, url });
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {}
  }

  if (error) {
    return (
      <main className="screen">
        <div className="spacer" />
        <div className="notice error" role="alert">{error}</div>
        <div className="spacer" />
        <Link href="/" className="btn">
          Zpět na začátek
        </Link>
      </main>
    );
  }

  if (!place) {
    return (
      <main className="screen">
        <div className="spinner" />
      </main>
    );
  }

  return (
    <main className="screen">
      <div className="reveal">
        <div className={`hero ${place.category}`}>
          <span className="hero-icon">
            <Icon name={place.category} size={40} />
          </span>
        </div>
        <p className="reveal-kicker">{arrived ? "Jsi tady" : "Mířil jsi sem"}</p>
        <h1 className="large-title">{place.name}</h1>
        <p className="subtitle" style={{ marginBottom: 16 }}>
          <span className="pill">
            <Icon name={place.category} size={15} />
            {CATEGORY_LABEL[place.category]}
          </span>
        </p>
        <div className="card">
          <div>{place.description}</div>
          {place.tip && (
            <div className="tip">
              <strong>Tip</strong>
              {place.tip}
            </div>
          )}
        </div>
        <div style={{ marginTop: 12 }}>
          <PlacesMap places={[place]} height={180} />
        </div>
      </div>

      <div className="spacer" />

      <div className="stack" style={{ marginTop: 24 }}>
        <div className="row">
          <button type="button" className="btn secondary" onClick={like} aria-pressed={liked}>
            <Icon name="heart" size={20} filled={liked} />
            {liked ? "Líbí se" : "Líbí se mi"}
          </button>
          <button type="button" className="btn secondary" onClick={share}>
            <Icon name={copied ? "check" : "share"} size={20} />
            {copied ? "Zkopírováno" : "Sdílet"}
          </button>
        </div>
        {!arrived && (
          <a
            className="btn secondary"
            href={`https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`}
            target="_blank"
            rel="noreferrer"
          >
            <Icon name="map" size={20} />
            Otevřít v mapách
          </a>
        )}
        <Link href="/go" className="btn">
          Ztratit se znovu
        </Link>
      </div>
    </main>
  );
}
