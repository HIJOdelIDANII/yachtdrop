/**
 * BottomNav — Fixed bottom navigation bar (iOS tab bar pattern).
 *
 * DESIGN DECISIONS:
 * - Fixed at bottom with z-40 (highest z-index in the app). CartBar (z-30)
 *   sits just above the nav visually but below in z-order.
 * - backdrop-blur-md + bg-card/95 creates a frosted glass effect that lets
 *   content scroll underneath while keeping the nav readable. This is the
 *   same technique iOS uses for its native tab bar.
 * - safe-bottom CSS class adds padding-bottom for devices with home indicators
 *   (iPhone X+, newer Androids) to prevent nav items from being occluded.
 * - Active state uses strokeWidth 2.5 (bolder) vs 1.5 (thinner) on icons.
 *   This is how Uber Eats and iOS differentiate active/inactive tabs —
 *   subtle but effective without needing color changes.
 * - 10px label text (text-[10px]) is the iOS standard for tab bar labels.
 * - 4-column grid ensures equal spacing regardless of label length.
 * - No framer-motion here — nav should feel instant, never animated.
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid3X3, Search, Package } from "lucide-react";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/browse", icon: Grid3X3, label: "Browse" },
  { href: "/search", icon: Search, label: "Search" },
  { href: "/orders", icon: Package, label: "Orders" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-md safe-bottom">
      <div className="mx-auto grid max-w-lg grid-cols-4">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 py-2 text-[10px] transition-colors ${
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground active:text-foreground"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2.5 : 1.5} />
              <span className={isActive ? "font-semibold" : "font-normal"}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
