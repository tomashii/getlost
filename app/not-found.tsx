import Link from "next/link";

export default function NotFound() {
  return (
    <main className="screen">
      <div className="spacer" />
      <h1 className="large-title">Tady nic není</h1>
      <p className="subtitle">Ztratit se je fajn, ale tahle stránka neexistuje.</p>
      <div className="spacer" />
      <Link href="/" className="btn">
        Zpět na začátek
      </Link>
    </main>
  );
}
