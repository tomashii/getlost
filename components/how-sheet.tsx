"use client";

import { useEffect } from "react";
import { Icon, type IconName } from "./icons";

const STEPS: { icon: IconName; title: string; text: string }[] = [
  { icon: "compass", title: "Jdi po šipce", text: "Ukazuje směr k cíli a kolik ti zbývá. Žádná mapa, žádný název." },
  { icon: "eye", title: "Cestu si volíš sám", text: "Šipka míří vzdušnou čarou. Dívej se kolem sebe a choď jen tudy, kudy se smí." },
  { icon: "pin", title: "Cíl se odhalí na místě", text: "Až dojdeš, zjistíš, kde jsi. Když nebudeš chtít dál, cíl ti prozradíme." },
];

export function HowSheet({ open, onClose, cta = "Rozumím" }: { open: boolean; onClose: () => void; cta?: string }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="how-title" onClick={(e) => e.stopPropagation()}>
        <div className="grabber" />
        <h2 id="how-title" className="title-1">Jak to funguje</h2>
        <ul className="steps">
          {STEPS.map((s) => (
            <li key={s.title}>
              <Icon name={s.icon} size={34} />
              <div>
                <strong>{s.title}</strong>
                <p>{s.text}</p>
              </div>
            </li>
          ))}
        </ul>
        <button type="button" className="btn" onClick={onClose}>
          {cta}
        </button>
      </div>
    </div>
  );
}
