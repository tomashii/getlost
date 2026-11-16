import Link from "next/link";

export default function NotFound() {
  return (
    <main className="screen">
      <div className="empty">
        <h1 className="title-1">Tady nic není</h1>
        <p>Ztratit se je fajn, ale tahle stránka neexistuje.</p>
      </div>
      <Link href="/" className="btn">
        Zpět na začátek
      </Link>
    </main>
  );
}
