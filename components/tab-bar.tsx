"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./icons";

const TABS: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Výlet", icon: "compass" },
  { href: "/me", label: "Místa", icon: "map" },
  { href: "/profile", label: "Profil", icon: "user" },
];

export function TabBar({ dark = false }: { dark?: boolean }) {
  const path = usePathname();
  return (
    <nav className={`tabbar${dark ? " dark" : ""}`} aria-label="Hlavní navigace">
      <div>
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} aria-current={path === t.href ? "page" : undefined}>
            <Icon name={t.icon} size={24} />
            {t.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
