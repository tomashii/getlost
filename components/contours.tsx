/**
 * Vrstevnice jako na turistické mapě. Křivky se počítají předem a vždy stejně,
 * každá pátá je zesílená (stejně jako zdůrazněné vrstevnice na mapách).
 */
function ring(i: number): string {
  const cx = 500;
  const cy = 520;
  const r = 26 + i * 30;
  const n = 56;
  const pts: [number, number][] = [];
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    const wobble =
      1 + 0.11 * Math.sin(3 * a + i * 0.55) + 0.07 * Math.sin(5 * a - i * 0.9) + 0.035 * Math.sin(9 * a + i * 1.7);
    pts.push([cx + r * wobble * Math.cos(a) * 1.18, cy + r * wobble * Math.sin(a)]);
  }
  const f = (v: number) => v.toFixed(1);
  const mid = (p: [number, number], q: [number, number]) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const start = mid(pts[n - 1], pts[0]);
  let d = `M${f(start[0])} ${f(start[1])}`;
  for (let k = 0; k < n; k++) {
    const m = mid(pts[k], pts[(k + 1) % n]);
    d += `Q${f(pts[k][0])} ${f(pts[k][1])} ${f(m[0])} ${f(m[1])}`;
  }
  return d + "Z";
}

const RINGS = Array.from({ length: 20 }, (_, i) => ring(i));

export function Contours() {
  return (
    <svg className="contours" viewBox="0 0 1000 1040" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {RINGS.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="currentColor" strokeWidth={i % 5 === 4 ? 3 : 1.4} />
      ))}
    </svg>
  );
}
