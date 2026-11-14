import Link from "next/link";
import { Contours } from "@/components/contours";
import { Icon } from "@/components/icons";
import { Marker } from "@/components/marker";
import { TabBar } from "@/components/tab-bar";

export default function Home() {
  return (
    <div className="bleed">
      <Contours />
      <main className="screen on-dark has-tabs">
        <div className="brand">
          <Marker />
          Get Lost
        </div>
        <h1 className="display xl home-title">Nevíš kam?</h1>
        <p className="lede">Nech se vést. Cíl uvidíš, až tam budeš.</p>
        <div className="spacer" />
        <Link href="/go" className="btn slab">
          Ztratit se
          <Icon name="arrow" size={38} filled />
        </Link>
      </main>
      <TabBar dark />
    </div>
  );
}
