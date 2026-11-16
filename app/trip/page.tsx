"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { buzz, setVoiceEnabled, speak, spokenDistance, stopSpeaking, voiceEnabled } from "@/lib/cues";
import { bearingDeg, distanceM, formatDistance } from "@/lib/geo";
import { addHistory, clearTrip, loadTrip, markSeen, type ActiveTrip } from "@/lib/trip-store";

const DEFAULT_RADIUS_M = 70;
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
  const [voice, setVoice] = useState(true);
  const lastSample = useRef<number | null>(null);
  const lastTrend = useRef<"closer" | "farther" | null>(null);
  const milestones = useRef<number[]>([]);
  const rotation = useRef(0);

  // Načti aktivní výlet, bez něj tu nemáme co dělat.
  useEffect(() => {
    const t = loadTrip();
    if (!t) {
      router.replace("/");
      return;
    }
    setTrip(t);
    setPos({ lat: t.startLat, lng: t.startLng });
    setVoice(voiceEnabled());
    milestones.current = [1000, 500, 200, 100].filter((m) => m < t.startDistanceM * 0.9);
    speak(`Vyrážíme. Cíl je ${spokenDistance(t.startDistanceM)} daleko. Jdi po šipce.`);
  }, [router]);

  // Nech displej svítit, dokud výlet běží.
  useEffect(() => {
    if (!trip || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    const acquire = () =>
      navigator.wakeLock
        .request("screen")
        .then((l) => (lock = l))
        .catch(() => {});
    const onVisible = () => document.visibilityState === "visible" && acquire();
    acquire();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      lock?.release().catch(() => {});
    };
  }, [trip]);

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
    if (remaining <= (trip.radiusM ?? DEFAULT_RADIUS_M)) {
      markSeen(trip.id);
      addHistory({ id: trip.id, arrived: true, distanceM: trip.startDistanceM, mode: trip.mode });
      clearTrip();
      buzz([80, 60, 160]);
      speak("Jsi na místě.");
      router.replace(`/reveal/${trip.id}?arrived=1`);
      return;
    }
    if (lastSample.current == null) {
      lastSample.current = remaining;
      return;
    }
    // Hlasové milníky: "Zbývá 200 metrů."
    const next = milestones.current[0];
    if (next !== undefined && remaining <= next) {
      milestones.current = milestones.current.filter((m) => m < remaining);
      speak(`Zbývá ${spokenDistance(next)}.`);
    }
    const diff = remaining - lastSample.current;
    if (Math.abs(diff) >= 20) {
      const trend = diff < 0 ? "closer" : "farther";
      setHint(trend === "closer" ? "Přihořívá." : "Samá voda. Zkus to jinudy.");
      // Ozvi se jen při změně směru, ať to nemluví pořád.
      if (trend !== lastTrend.current) {
        if (trend === "farther") {
          buzz([200, 100, 200]);
          speak("Vzdaluješ se. Zkus to jinudy.");
        } else if (lastTrend.current === "farther") {
          buzz(60);
          speak("Dobrý směr.");
        }
        lastTrend.current = trend;
      }
      lastSample.current = remaining;
    }
  }, [trip, remaining, router]);

  function toggleVoice() {
    const on = !voice;
    setVoice(on);
    setVoiceEnabled(on);
    if (on) speak("Hlasové pokyny zapnuty.");
  }

  function giveUp() {
    if (!trip) return;
    stopSpeaking();
    markSeen(trip.id);
    addHistory({ id: trip.id, arrived: false, distanceM: trip.startDistanceM, mode: trip.mode });
    clearTrip();
    router.replace(`/reveal/${trip.id}`);
  }

  function cancel() {
    stopSpeaking();
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
  const progress = Math.max(0, Math.min(1, 1 - remaining / Math.max(trip.startDistanceM, 1)));

  return (
    <main className="screen">
      <div className="nav">
        <button type="button" className="nav-link" onClick={cancel}>
          <Icon name="back" />
          Ukončit
        </button>
        <div className="row" style={{ alignItems: "center" }}>
          {trip.demo && <span className="badge">Demo</span>}
          <button
            type="button"
            className="glass-btn plain-btn"
            onClick={toggleVoice}
            aria-pressed={voice}
            aria-label={voice ? "Vypnout hlasové pokyny" : "Zapnout hlasové pokyny"}
          >
            <Icon name={voice ? "sound" : "mute"} />
          </button>
        </div>
      </div>

      <div className="trip-main">
        <div className="compass" aria-hidden="true">
          <svg className="ticks" viewBox="0 0 200 200" style={{ transform: `rotate(${-(heading ?? 0)}deg)` }}>
            {Array.from({ length: 60 }, (_, i) =>
              i % 15 === 0 ? null : (
                <line
                  key={i}
                  x1="100"
                  y1="10"
                  x2="100"
                  y2={i % 5 === 0 ? 19 : 15}
                  stroke="currentColor"
                  strokeWidth={i % 5 === 0 ? 1.6 : 1}
                  opacity={i % 5 === 0 ? 0.45 : 0.2}
                  transform={`rotate(${i * 6} 100 100)`}
                />
              ),
            )}
            <text x="100" y="22" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--red)">S</text>
            <text x="183" y="104.5" textAnchor="middle" fontSize="12" fontWeight="600" fill="currentColor" opacity="0.5">V</text>
            <text x="100" y="188" textAnchor="middle" fontSize="12" fontWeight="600" fill="currentColor" opacity="0.5">J</text>
            <text x="17" y="104.5" textAnchor="middle" fontSize="12" fontWeight="600" fill="currentColor" opacity="0.5">Z</text>
          </svg>
          <svg className="arrow" viewBox="0 0 100 100" style={{ transform: `rotate(${rotation.current}deg)` }}>
            <path d="M50 6 L84 90 Q50 70 16 90 Z" fill="currentColor" stroke="currentColor" strokeWidth="6" strokeLinejoin="round" />
          </svg>
        </div>

        <div>
          <div className="distance" aria-live="polite">
            {value}
            <small>{unit}</small>
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
          <button type="button" className="btn gray" onClick={enableCompass}>
            Zapnout kompas
          </button>
        )}
        {heading == null && !needsCompassPermission && (
          <p className="section-footer" style={{ textAlign: "center" }}>
            Bez kompasu šipka ukazuje směr vůči severu (S je nahoře).
          </p>
        )}
        {confirmGiveUp ? (
          <div className="row">
            <button type="button" className="btn gray" onClick={() => setConfirmGiveUp(false)}>
              Jdu dál
            </button>
            <button type="button" className="btn" onClick={giveUp}>
              Prozradit
            </button>
          </div>
        ) : (
          <button type="button" className="btn plain destructive" onClick={() => setConfirmGiveUp(true)}>
            Vzdát to a prozradit cíl
          </button>
        )}
      </div>
    </main>
  );
}
