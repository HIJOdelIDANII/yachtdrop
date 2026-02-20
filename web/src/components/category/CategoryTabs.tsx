"use client";

import { useCategories } from "@/lib/hooks/useData";
import { Skeleton } from "@/components/ui/skeleton";
import { memo, useState, useRef, useEffect, useCallback, type ElementType } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  ChevronDown,
  X,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
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

function getCategoryIcon(slug: string): LucideIcon {
  return CATEGORY_ICONS[slug] || LayoutGrid;
}

interface CategoryTabsProps {
  selected: string | null;
  onSelect: (id: string | null) => void;
}

const MIN_PRODUCTS = 5;

export const CategoryTabs = memo(function CategoryTabs({
  selected,
  onSelect,
}: CategoryTabsProps) {
  const { data: categories, isLoading } = useCategories();
  const [showAll, setShowAll] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const filtered = categories?.filter((c) => c.productCount >= MIN_PRODUCTS) ?? [];
  const topCategories = filtered.slice(0, 12);
  const hasMore = filtered.length > 12;

  const selectedCat = filtered.find((c) => c.id === selected);
  const selectedInTop = topCategories.some((c) => c.id === selected);

  const closeAll = useCallback(() => setShowAll(false), []);

  useEffect(() => {
    if (selected && scrollRef.current) {
      const btn = scrollRef.current.querySelector(`[data-cat-id="${selected}"]`);
      if (btn) {
        btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }, [selected]);

  useEffect(() => {
    if (showAll) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [showAll]);

  if (isLoading) {
    return (
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-2.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 shrink-0 rounded-full" />
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Horizontal pills */}
      <div ref={scrollRef} className="no-scrollbar flex gap-1.5 overflow-x-auto px-4 py-2.5">
        <Pill
          label="All"
          icon={LayoutGrid}
          count={null}
          isActive={!selected}
          onClick={() => { onSelect(null); setShowAll(false); }}
        />
        {topCategories.map((cat) => (
          <Pill
            key={cat.id}
            dataCatId={cat.id}
            label={cat.name}
            icon={getCategoryIcon(cat.slug)}
            count={cat.productCount}
            isActive={selected === cat.id}
            onClick={() => onSelect(cat.id)}
          />
        ))}
        {selected && !selectedInTop && selectedCat && (
          <Pill
            dataCatId={selectedCat.id}
            label={selectedCat.name}
            icon={getCategoryIcon(selectedCat.slug)}
            count={selectedCat.productCount}
            isActive
            onClick={() => onSelect(selectedCat.id)}
          />
        )}
        {hasMore && (
          <button
            onClick={() => setShowAll(!showAll)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium transition-all duration-150 min-h-[34px] flex items-center gap-1.5 ${
              showAll
                ? "bg-foreground text-background shadow-sm"
                : "bg-secondary text-muted-foreground active:bg-secondary/80"
            }`}
          >
            More
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAll ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>

      {/* Expanded grid overlay — portaled to body to escape stacking contexts */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {showAll && (
            <motion.div
              key="cat-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50"
            >
              <div className="absolute inset-0 bg-black/40" onClick={closeAll} />
              <motion.div
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                exit={{ y: -20 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="relative z-10 max-h-[70vh] overflow-y-auto overscroll-contain rounded-b-2xl bg-background shadow-xl"
              >
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between mb-2.5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      All Categories
                    </p>
                    <button
                      onClick={closeAll}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted active:bg-muted/80"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 pb-2">
                    {filtered.map((cat) => {
                      const Icon = getCategoryIcon(cat.slug);
                      return (
                        <button
                          key={cat.id}
                          onClick={() => {
                            onSelect(cat.id);
                            setShowAll(false);
                          }}
                          className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all ${
                            selected === cat.id
                              ? "bg-foreground text-background"
                              : "bg-secondary/60 text-foreground hover:bg-secondary"
                          }`}
                        >
                          <Icon className={`h-4 w-4 shrink-0 ${
                            selected === cat.id ? "text-background/70" : "text-muted-foreground"
                          }`} />
                          <span className="text-[13px] font-medium truncate flex-1">
                            {cat.name}
                          </span>
                          <span className={`text-[11px] shrink-0 ${
                            selected === cat.id ? "text-background/60" : "text-muted-foreground"
                          }`}>
                            {cat.productCount}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
});

function Pill({
  label,
  icon: Icon,
  count,
  isActive,
  onClick,
  dataCatId,
}: {
  label: string;
  icon: ElementType;
  count: number | null;
  isActive: boolean;
  onClick: () => void;
  dataCatId?: string;
}) {
  return (
    <button
      data-cat-id={dataCatId}
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium transition-all duration-150 min-h-[34px] flex items-center gap-1.5 ${
        isActive
          ? "bg-foreground text-background shadow-sm"
          : "bg-secondary text-muted-foreground active:bg-secondary/80"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
      {count !== null && (
        <span className={`text-[11px] ${isActive ? "text-background/70" : "text-muted-foreground/60"}`}>
          {count}
        </span>
      )}
    </button>
  );
}
