"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Grid3X3, Search, ClipboardList } from "lucide-react";

const tabs = [
  { href: "/", label: "Home", icon: null },
  { href: "/browse", label: "Browse", icon: Grid3X3 },
  { href: "/search", label: "Search", icon: Search },
  { href: "/orders", label: "Orders", icon: ClipboardList },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      data-testid="bottom-nav"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card shadow-[0_-1px_0_rgba(0,0,0,0.06)] safe-bottom"
    >
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              data-testid={`nav-${label.toLowerCase()}`}
              className={`flex min-h-[56px] min-w-[64px] flex-col items-center justify-center gap-0.5 px-3 py-2 text-xs transition-colors ${
                active
                  ? "text-[var(--color-ocean)]"
                  : "text-muted-foreground active:text-[var(--color-ocean)]"
              }`}
            >
              {label === "Home" ? (
                <Image
                  src="/brand/logo.png"
                  alt="Home"
                  width={22}
                  height={22}
                  className={active ? "opacity-100" : "opacity-60"}
                />
              ) : Icon ? (
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 1.5} />
              ) : null}
              <span className={active ? "font-semibold" : "font-normal"}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
