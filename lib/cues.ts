/** Hlasové pokyny a vibrace, aby se uživatel nemusel pořád dívat na displej. */

const KEY = "getlost.voice";

export function voiceEnabled(): boolean {
  try {
    return localStorage.getItem(KEY) !== "0";
  } catch {
    return true;
  }
}

export function setVoiceEnabled(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "1" : "0");
  } catch {}
  if (!on) stopSpeaking();
}

export function speak(text: string) {
  if (!voiceEnabled() || typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "cs-CZ";
    u.rate = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {}
}

/** Zavolej při klepnutí, aby prohlížeč později povolil mluvit bez dalšího dotyku. */
export function unlockSpeech() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    const u = new SpeechSynthesisUtterance(" ");
    u.volume = 0;
    window.speechSynthesis.speak(u);
  } catch {}
}

export function stopSpeaking() {
  try {
    window.speechSynthesis?.cancel();
  } catch {}
}

/** Vibrace (funguje na Androidu, iPhone ji z webu neumí). */
export function buzz(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {}
}

/** "350 m" → "350 metrů", "1,2 km" → "1,2 kilometru" pro hlasový výstup. */
export function spokenDistance(m: number): string {
  if (m < 1000) return `${Math.round(m / 10) * 10} metrů`;
  return `${(m / 1000).toFixed(1).replace(".", ",")} kilometru`;
}
