"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HowSheet } from "@/components/how-sheet";
import { Icon, type IconName } from "@/components/icons";
import { TabBar } from "@/components/tab-bar";
import { setVoiceEnabled, speak, unlockSpeech, voiceEnabled } from "@/lib/cues";
import { loadHistory, type HistoryEntry } from "@/lib/trip-store";

function badges(history: HistoryEntry[]) {
  const arrived = history.filter((h) => h.arrived);
  const km = arrived.reduce((sum, h) => sum + h.distanceM, 0) / 1000;
  const modes = new Set(arrived.map((h) => h.mode)).size;
  const clamp = (n: number, max: number) => Math.min(Math.floor(n), max);
  const list: { name: string; text: string; have: number; need: number; icon: IconName }[] = [
    { name: "První ztracení", text: "Dojdi do svého prvního cíle", have: clamp(arrived.length, 1), need: 1, icon: "pin" },
    { name: "Pět cílů", text: "Dojdi do pěti cílů", have: clamp(arrived.length, 5), need: 5, icon: "compass" },
    { name: "Deset kilometrů", text: "Nasbírej deset kilometrů k cíli", have: clamp(km, 10), need: 10, icon: "walk" },
    { name: "Dvojí doprava", text: "Dojdi do cíle dvěma způsoby dopravy", have: clamp(modes, 2), need: 2, icon: "bike" },
  ];
  return list;
}

export default function Profile() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [voice, setVoice] = useState(true);
  const [how, setHow] = useState(false);

  useEffect(() => {
    setHistory(loadHistory());
    setVoice(voiceEnabled());
  }, []);

  const arrived = history.filter((h) => h.arrived);
  const km = arrived.reduce((sum, h) => sum + h.distanceM, 0) / 1000;

  function toggleVoice() {
    const on = !voice;
    setVoice(on);
    setVoiceEnabled(on);
    if (on) {
      unlockSpeech();
      speak("Hlasové pokyny zapnuty.");
    }
  }

  return (
    <>
      <main className="screen has-tabs">
        <h1 className="large-title" style={{ marginTop: 36 }}>Profil</h1>

        <div className="stats">
          <div className="stat">
            <strong>{history.length}</strong>
            <span>výletů</span>
          </div>
          <div className="stat">
            <strong>{arrived.length}</strong>
            <span>cílů</span>
          </div>
          <div className="stat">
            <strong>{km.toFixed(1).replace(".", ",")}</strong>
            <span>km k cíli</span>
          </div>
        </div>

        <h2 className="section-header">Odznaky</h2>
        <div className="group">
          {badges(history).map((b) => {
            const earned = b.have >= b.need;
            return (
              <div key={b.name} className="cell with-glyph">
                <span className={`glyph round${earned ? "" : " muted"}`}>
                  <Icon name={earned ? "check" : b.icon} size={18} />
                </span>
                <span className="grow">
                  {b.name}
                  <small>{earned ? "Získáno" : b.text}</small>
                </span>
                {!earned && <span className="subhead">{b.have}/{b.need}</span>}
              </div>
            );
          })}
        </div>

        <h2 className="section-header">Nastavení</h2>
        <div className="group">
          <button type="button" className="cell" role="switch" aria-checked={voice} onClick={toggleVoice}>
            <span className="grow">Hlasové pokyny</span>
            <span className="switch" />
          </button>
        </div>
        <p className="section-footer">Řekne ti, kolik zbývá a jestli jdeš správně, ať nemusíš koukat do mobilu.</p>

        <div className="group" style={{ marginTop: 24 }}>
          <button type="button" className="cell" onClick={() => setHow(true)}>
            <span className="grow">Jak to funguje</span>
            <span className="chev"><Icon name="chevron" size={16} /></span>
          </button>
          <Link href="/add" className="cell">
            <span className="grow">Přidat vlastní místo</span>
            <span className="chev"><Icon name="chevron" size={16} /></span>
          </Link>
        </div>
      </main>
      <TabBar />
      <HowSheet open={how} onClose={() => setHow(false)} />
    </>
  );
}
