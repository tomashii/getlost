"use client";

import { useEffect } from "react";

const STEPS = [
  { title: "Jdi po šipce", text: "Ukazuje směr k cíli a kolik ti zbývá. Žádná mapa, žádný název." },
  { title: "Cestu si volíš sám", text: "Šipka míří vzdušnou čarou. Dívej se kolem sebe a choď jen tudy, kudy se smí." },
  { title: "Cíl se odhalí na místě", text: "Až dojdeš, zjistíš, kde jsi. Když nebudeš chtít dál, cíl ti prozradíme." },
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
        <h2 id="how-title" className="display m">Jak to funguje</h2>
        <ol className="steps">
          {STEPS.map((s) => (
            <li key={s.title}>
              <div>
                <strong>{s.title}</strong>
                <p>{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <button type="button" className="btn" onClick={onClose}>
          {cta}
        </button>
      </div>
    </div>
  );
}
