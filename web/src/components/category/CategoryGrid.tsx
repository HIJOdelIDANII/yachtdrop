/**
 * CategoryGrid — Uber Eats-style circular icon quick-links for the home page.
 *
 * DESIGN DECISIONS:
 * - Circular icons (not pills/tabs) because on a discovery page they act as
 *   navigation shortcuts, not filters. Uber Eats uses this exact pattern on
 *   their home screen to represent cuisine types.
 * - Tapping navigates to /browse?category=ID rather than filtering in-place.
 *   This keeps the home page as a lightweight discovery surface — the heavy
 *   ProductGrid + infinite scroll only mounts on /browse.
 * - ICON_MAP maps category.icon strings (from the database) to Lucide icons.
 *   Fallback is Anchor (brand-relevant). If categories don't have icons set,
 *   all will show Anchor — still looks intentional.
 * - Capped at 10 categories (.slice(0, 10)) to prevent the row from being
 *   overwhelmingly long. "See all" link on the section header leads to /browse.
 * - Staggered motion.button entrance (delay: i * 0.05) creates a left-to-right
 *   wave effect that matches the scroll direction.
 * - 14x14 circle (h-14 w-14) with 11px label below matches Uber Eats sizing.
 *   max-w-[64px] + truncate prevents long category names from breaking layout.
 */
"use client";

import { useCategories } from "@/lib/hooks/useData";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Anchor,
  Zap,
  ShieldCheck,
  Cable,
  Sofa,
  CircleDot,
  Paintbrush,
  Ribbon,
  ArrowDownUp,
  FlaskConical,
  Ship,
  Gauge,
  Link,
  BatteryCharging,
  Plug,
  Wrench,
  Waves,
  HardHat,
  Thermometer,
  ShoppingBasket,
  CircuitBoard,
  Droplets,
  Shirt,
  LifeBuoy,
  Disc,
  Wind,
  Flame,
  Activity,
  Magnet,
  Compass,
  Radio,
  Fuel,
  Bolt,
  Cog,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react";

const SLUG_ICONS: Record<string, LucideIcon> = {
  "anchoring-docking": Anchor,
  "electrics": Zap,
  "safety": ShieldCheck,
  "electric-terminals": Cable,
  "life-on-board": Sofa,
  "hole-saws": CircleDot,
  "other-painting-accessories": Paintbrush,
  "adhesive-tapes": Ribbon,
  "reductions": ArrowDownUp,
  "solvents-converters-paint-removers": FlaskConical,
  "outboard-motors": Ship,
  "gas-springs": Gauge,
  "shacklescarabiners": Link,
  "batteries-accessories": BatteryCharging,
  "connectors": Plug,
  "electricity-accessories": CircuitBoard,
  "mooring-lines": Waves,
  "protective-equipment": HardHat,
  "mooring-accessories": Anchor,
  "sander-disks-slides": Disc,
  "refrigeratorsfreezers": Thermometer,
  "fitting": Wrench,
  "baskets": ShoppingBasket,
  "chargers-accessories": BatteryCharging,
  "bases": CircuitBoard,
  "hand-tools": Wrench,
  "water-filters": Droplets,
  "female-jackets": Shirt,
  "fenders": LifeBuoy,
  "tensioners": Gauge,
  "sanders": Disc,
  "pneumatic-tool-accessories": Wind,
  "firefighting-equipment": Flame,
  "motor-valves": Activity,
  "absorbers": Magnet,
  "instrument-systems": Compass,
  "transducers": Activity,
  "anchors": Anchor,
  "telephony": Radio,
  "gas": Fuel,
  "fuses-fuse-holders": Bolt,
  "tools-machines": Cog,
  "motor": Ship,
};

const FALLBACK_ICON = LayoutGrid;

/**
 * Uber Eats-style category quick-links — circular icons in a horizontal scroll.
 * Tapping navigates to /browse with category pre-selected.
 */
export function CategoryGrid() {
  const { data: categories, isLoading } = useCategories();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="no-scrollbar flex gap-4 overflow-x-auto px-4 py-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex shrink-0 flex-col items-center gap-1.5">
            <Skeleton className="h-14 w-14 rounded-full" />
            <Skeleton className="h-3 w-10" />
          </div>
        ))}
      </div>
    );
  }

  if (!categories || categories.length === 0) return null;

  return (
    <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 py-1">
      {categories.slice(0, 10).map((cat, i) => {
        const Icon = (cat.slug && SLUG_ICONS[cat.slug]) || FALLBACK_ICON;

        return (
          <motion.button
            key={cat.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05, ease: "easeOut" }}
            className="flex shrink-0 flex-col items-center gap-1.5 active:scale-95 transition-transform"
            onClick={() => router.push(`/browse?category=${cat.id}`)}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
              <Icon className="h-6 w-6 text-foreground" strokeWidth={1.5} />
            </div>
            <span className="max-w-[64px] truncate text-[11px] font-medium text-foreground">
              {cat.name}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
