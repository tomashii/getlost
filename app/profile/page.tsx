"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HowSheet } from "@/components/how-sheet";
import { Icon } from "@/components/icons";
import { TabBar } from "@/components/tab-bar";
import { setVoiceEnabled, speak, unlockSpeech, voiceEnabled } from "@/lib/cues";
import { loadHistory, type HistoryEntry } from "@/lib/trip-store";

function badges(history: HistoryEntry[]) {
  const arrived = history.filter((h) => h.arrived);
  const km = arrived.reduce((sum, h) => sum + h.distanceM, 0) / 1000;
  const modes = new Set(arrived.map((h) => h.mode)).size;
  const clamp = (n: number, max: number) => Math.min(Math.floor(n), max);
  return [
    { name: "První ztracení", text: "Dojdi do svého prvního cíle.", have: clamp(arrived.length, 1), need: 1 },
    { name: "Pět cílů", text: "Dojdi do pěti cílů.", have: clamp(arrived.length, 5), need: 5 },
    { name: "Deset kilometrů", text: "Nasbírej deset kilometrů k cíli.", have: clamp(km, 10), need: 10 },
    { name: "Dvojí doprava", text: "Dojdi do cíle dvěma různými způsoby dopravy.", have: clamp(modes, 2), need: 2 },
  ];
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
        <h1 className="display l" style={{ margin: "20px 0 24px" }}>Profil</h1>

        <div className="stats">
          <div>
            <strong>{history.length}</strong>
            <span>výletů</span>
          </div>
          <div>
            <strong>{arrived.length}</strong>
            <span>cílů</span>
          </div>
          <div>
            <strong>{km.toFixed(1).replace(".", ",")}</strong>
            <span>km k cíli</span>
          </div>
        </div>

        <h2 className="label">Odznaky</h2>
        <ul className="badges">
          {badges(history).map((b) => {
            const earned = b.have >= b.need;
            return (
              <li key={b.name} className={earned ? "earned" : ""}>
                <span className="seal">{earned && <Icon name="check" size={22} />}</span>
                <div>
                  <strong>{b.name}</strong>
                  <small>{earned ? "Získáno" : `${b.text} Máš ${b.have} z ${b.need}.`}</small>
                </div>
              </li>
            );
          })}
        </ul>

        <h2 className="label">Nastavení</h2>
        <div>
          <button type="button" className="setting" role="switch" aria-checked={voice} onClick={toggleVoice}>
            <span>
              Hlasové pokyny
              <small>Řekne ti, kolik zbývá a jestli jdeš správně, ať nemusíš koukat do mobilu.</small>
            </span>
            <span className="switch" />
          </button>
          <button type="button" className="setting" onClick={() => setHow(true)}>
            Jak to funguje
            <Icon name="chevron" size={18} />
          </button>
          <Link href="/add" className="setting">
            Přidat vlastní místo
            <Icon name="chevron" size={18} />
          </Link>
        </div>
      </main>
      <TabBar />
      <HowSheet open={how} onClose={() => setHow(false)} />
    </>
  );
}
