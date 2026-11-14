"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { bearingDeg, distanceM, formatDistance } from "@/lib/geo";
import { clearTrip, loadTrip, markSeen, type ActiveTrip } from "@/lib/trip-store";

const ARRIVAL_RADIUS_M = 50;
const DEMO_STEPS = 45;

type OrientationEvent = DeviceOrientationEvent & { webkitCompassHeading?: number };
type OrientationCtor = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<"granted" | "denied"> };

export default function Trip() {
  const router = useRouter();
  const [trip, setTrip] = useState<ActiveTrip | null>(null);
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [needsCompassPermission, setNeedsCompassPermission] = useState(false);
  const [gpsError, setGpsError] = useState(false);
  const [hint, setHint] = useState("Jdi po šipce.");
  const [confirmGiveUp, setConfirmGiveUp] = useState(false);
  const lastSample = useRef<number | null>(null);
  const rotation = useRef(0);

  // Načti aktivní výlet, bez něj tu nemáme co dělat.
  useEffect(() => {
    const t = loadTrip();
    if (!t) {
      router.replace("/go");
      return;
    }
    setTrip(t);
    setPos({ lat: t.startLat, lng: t.startLng });
  }, [router]);

  // Poloha: skutečná GPS, nebo simulovaný pohyb v demo režimu.
  useEffect(() => {
    if (!trip) return;
    if (trip.demo) {
      let step = 0;
      const timer = setInterval(() => {
        step += 1;
        const t = Math.min(step / DEMO_STEPS, 1);
        setPos({
          lat: trip.startLat + (trip.lat - trip.startLat) * t,
          lng: trip.startLng + (trip.lng - trip.startLng) * t,
        });
        if (t >= 1) clearInterval(timer);
      }, 1000);
      return () => clearInterval(timer);
    }
    if (!("geolocation" in navigator)) {
      setGpsError(true);
      return;
    }
    const watch = navigator.geolocation.watchPosition(
      (p) => {
        setGpsError(false);
        setPos({ lat: p.coords.latitude, lng: p.coords.longitude });
      },
      () => setGpsError(true),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, [trip]);

  // Kompas. iOS chce výslovné povolení po klepnutí, Android ne.
  function listenToCompass() {
    const handler = (event: Event) => {
      const e = event as OrientationEvent;
      if (typeof e.webkitCompassHeading === "number") setHeading(e.webkitCompassHeading);
      else if (e.absolute && e.alpha != null) setHeading((360 - e.alpha) % 360);
    };
    window.addEventListener("deviceorientationabsolute", handler);
    window.addEventListener("deviceorientation", handler);
    return () => {
      window.removeEventListener("deviceorientationabsolute", handler);
      window.removeEventListener("deviceorientation", handler);
    };
  }

  useEffect(() => {
    if (typeof DeviceOrientationEvent === "undefined") return;
    if (typeof (DeviceOrientationEvent as OrientationCtor).requestPermission === "function") {
      // Jen na dotykových zařízeních, počítač kompas nemá.
      if (window.matchMedia("(pointer: coarse)").matches) setNeedsCompassPermission(true);
      return;
    }
    return listenToCompass();
  }, []);

  async function enableCompass() {
    try {
      const result = await (DeviceOrientationEvent as OrientationCtor).requestPermission?.();
      if (result === "granted") listenToCompass();
    } catch {}
    setNeedsCompassPermission(false);
  }

  const remaining = trip && pos ? distanceM(pos.lat, pos.lng, trip.lat, trip.lng) : null;

  // Přihořívá / samá voda a kontrola příchodu.
  useEffect(() => {
    if (!trip || remaining == null) return;
    if (remaining <= ARRIVAL_RADIUS_M) {
      markSeen(trip.id);
      clearTrip();
      try {
        navigator.vibrate?.([80, 60, 160]);
      } catch {}
      router.replace(`/reveal/${trip.id}?arrived=1`);
      return;
    }
    if (lastSample.current == null) {
      lastSample.current = remaining;
      return;
    }
    const diff = remaining - lastSample.current;
    if (Math.abs(diff) >= 20) {
      setHint(diff < 0 ? "Přihořívá." : "Samá voda. Zkus to jinudy.");
      lastSample.current = remaining;
    }
  }, [trip, remaining, router]);

  function giveUp() {
    if (!trip) return;
    markSeen(trip.id);
    clearTrip();
    router.replace(`/reveal/${trip.id}`);
  }

  function cancel() {
    clearTrip();
    router.replace("/");
  }

  if (!trip || !pos || remaining == null) {
    return (
      <main className="screen">
        <div className="spinner" />
      </main>
    );
  }

  // Otáčej šipku vždy kratší cestou, ať se nepřetáčí přes 360°.
  const targetAngle = bearingDeg(pos.lat, pos.lng, trip.lat, trip.lng) - (heading ?? 0);
  const delta = ((((targetAngle - rotation.current) % 360) + 540) % 360) - 180;
  rotation.current += delta;

  const [value, unit] = formatDistance(remaining).split(" ");
  const dist = { value, unit };
  const progress = Math.max(0, Math.min(1, 1 - remaining / Math.max(trip.startDistanceM, 1)));

  return (
    <main className="screen">
      <div className="nav">
        <button type="button" onClick={cancel}>
          <Icon name="back" />
          Ukončit
        </button>
        {trip.demo && <span className="badge">Demo</span>}
      </div>

      <div className="compass-wrap">
        <div className="compass" aria-hidden="true">
          <svg className="ticks" viewBox="0 0 200 200" style={{ transform: `rotate(${-(heading ?? 0)}deg)` }}>
            {Array.from({ length: 60 }, (_, i) => (
              <line
                key={i}
                x1="100"
                y1={i % 15 === 0 ? 20 : 8}
                x2="100"
                y2={i % 5 === 0 ? 16 : 12}
                stroke="currentColor"
                strokeWidth={i % 15 === 0 ? 0 : i % 5 === 0 ? 1.6 : 0.8}
                opacity={i % 5 === 0 ? 0.7 : 0.35}
                transform={`rotate(${i * 6} 100 100)`}
              />
            ))}
            <text x="100" y="19" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--danger)">S</text>
            <text x="181" y="104" textAnchor="middle" fontSize="10" fontWeight="600" fill="currentColor">V</text>
            <text x="100" y="189" textAnchor="middle" fontSize="10" fontWeight="600" fill="currentColor">J</text>
            <text x="19" y="104" textAnchor="middle" fontSize="10" fontWeight="600" fill="currentColor">Z</text>
          </svg>
          <svg className="arrow" viewBox="0 0 100 100" style={{ transform: `rotate(${rotation.current}deg)` }}>
            <defs>
              <linearGradient id="arrow-fill" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#3ccf78" />
                <stop offset="1" stopColor="#158544" />
              </linearGradient>
            </defs>
            <path d="M50 4 L84 92 L50 74 L16 92 Z" fill="url(#arrow-fill)" strokeLinejoin="round" />
          </svg>
        </div>
        <div style={{ textAlign: "center" }}>
          <div className="distance" aria-live="polite">
            {dist.value}
            <small>{dist.unit}</small>
          </div>
          <p className="hint">{hint}</p>
        </div>
        <div className="progress" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
          <div style={{ width: `${progress * 100}%` }} />
        </div>
      </div>

      <div className="stack">
        {gpsError && (
          <div className="notice error" role="alert">
            Nemám signál GPS. Zkontroluj, že má prohlížeč povolenou polohu.
          </div>
        )}
        {trip.stretched && progress < 0.1 && (
          <div className="notice">V okolí zatím moc míst nemáme, tohle je o kus dál, než sis vybral.</div>
        )}
        {needsCompassPermission && (
          <button type="button" className="btn secondary" onClick={enableCompass}>
            Zapnout kompas
          </button>
        )}
        {heading == null && !needsCompassPermission && (
          <p className="footnote">Bez kompasu šipka ukazuje směr vůči severu (S je nahoře).</p>
        )}
        {confirmGiveUp ? (
          <div className="row">
            <button type="button" className="btn secondary" onClick={() => setConfirmGiveUp(false)}>
              Jdu dál
            </button>
            <button type="button" className="btn" onClick={giveUp}>
              Prozradit
            </button>
          </div>
        ) : (
          <button type="button" className="btn plain danger" onClick={() => setConfirmGiveUp(true)}>
            Vzdát to a prozradit cíl
          </button>
        )}
      </div>
    </main>
  );
}
