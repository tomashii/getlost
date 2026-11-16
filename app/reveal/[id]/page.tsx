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
        <div className="empty">
          <p>{error}</p>
        </div>
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
    <>
      <div className="reveal-map">
        <PlacesMap places={[place]} />
        <Link href="/" className="glass-btn reveal-close" aria-label="Zavřít">
          <Icon name="close" />
        </Link>
      </div>

      <main className="reveal-card">
        <div className="grabber" />
        <p className="kicker">{arrived ? "Jsi tady" : "Mířil jsi sem"}</p>
        <h1 className="title-1">{place.name}</h1>
        <p className="category">
          <span className={`dot ${place.category}`} />
          {CATEGORY_LABEL[place.category]}
        </p>

        <div className="group">
          <div className="cell">
            <span className="grow">{place.description}</span>
          </div>
          {place.tip && (
            <div className="cell">
              <span className="grow">
                <small style={{ marginBottom: 2 }}>Tip</small>
                {place.tip}
              </span>
            </div>
          )}
        </div>

        <div className="row" style={{ margin: "14px 0" }}>
          <button type="button" className="action" onClick={like} aria-pressed={liked}>
            <Icon name="heart" filled={liked} />
            {liked ? "Líbí se" : "Líbí se mi"}
          </button>
          <button type="button" className="action" onClick={share}>
            <Icon name={copied ? "check" : "share"} />
            {copied ? "Zkopírováno" : "Sdílet"}
          </button>
          <a
            className="action"
            href={`https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`}
            target="_blank"
            rel="noreferrer"
          >
            <Icon name="location" />
            Trasa
          </a>
        </div>

        <div className="spacer" />
        <Link href="/" className="btn">
          Ztratit se znovu
        </Link>
      </main>
    </>
  );
}
