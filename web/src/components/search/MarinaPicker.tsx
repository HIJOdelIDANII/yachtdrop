"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Marina, MarinaWithDistance } from "@/types";
import { useMarinas, useUpsertMarina, haversineDistance, estimateETA } from "@/lib/hooks/useMarinas";
import { useGeolocation } from "@/lib/hooks/useGeolocation";
import { MarinaMap } from "./MarinaMap";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Navigation, Check, Search, Map } from "lucide-react";

interface MarinaPickerProps {
  selectedMarinaId?: string | null;
  onSelect: (marina: Marina) => void;
  defaultView?: "map" | "list";
}

export function MarinaPicker({ selectedMarinaId, onSelect, defaultView = "list" }: MarinaPickerProps) {
  const [filter, setFilter] = useState("");
  const [view, setView] = useState<"map" | "list">(defaultView);
  const { position, loading: geoLoading, error: geoError, request: requestGeo } = useGeolocation();
  const { data: marinas, isLoading } = useMarinas({
    query: filter || undefined,
    lat: position?.lat,
    lng: position?.lng,
  });
  const upsert = useUpsertMarina();

  const handleSelect = async (marina: Marina) => {
    if (marina.id?.startsWith("osm-")) {
      const saved = await upsert.mutateAsync(marina);
      onSelect({ ...marina, id: saved.id });
    } else {
      onSelect(marina);
    }
  };

  // Compute distances and sort by nearest
  const marinasWithDistance = useMemo<MarinaWithDistance[]>(() => {
    if (!marinas) return [];

    return marinas
      .map((m) => {
        if (position && m.lat && m.lng) {
          const dist = haversineDistance(
            position.lat,
            position.lng,
            Number(m.lat),
            Number(m.lng)
          );
          return { ...m, distance: dist, eta: estimateETA(dist) };
        }
        return { ...m } as MarinaWithDistance;
      })
      .sort((a, b) => {
        if (a.distance !== undefined && b.distance !== undefined)
          return a.distance - b.distance;
        if (a.distance !== undefined) return -1;
        if (b.distance !== undefined) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [marinas, position]);

  return (
    <div className="space-y-3">
      {/* Search + view toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search marinas..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-10 min-h-[44px]"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-[44px] w-[44px] shrink-0"
          onClick={() => setView(view === "map" ? "list" : "map")}
          aria-label={view === "map" ? "Switch to list view" : "Switch to map view"}
        >
          {view === "map" ? (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          ) : (
            <Map className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Geolocation prompt */}
      {!position && !geoLoading && (
        <div className="space-y-1">
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 text-xs"
            onClick={requestGeo}
          >
            <Navigation className="h-3.5 w-3.5" />
            Enable location for nearest marinas & routes
          </Button>
          {geoError && (
            <p className="text-xs text-destructive text-center">{geoError}</p>
          )}
        </div>
      )}
      {geoLoading && (
        <Button variant="outline" size="sm" className="w-full gap-2 text-xs" disabled>
          <Navigation className="h-3.5 w-3.5 animate-pulse" />
          Getting your location...
        </Button>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-[280px] w-full rounded-xl" />
        </div>
      )}

      {/* Map view */}
      {!isLoading && view === "map" && (
        <MarinaMap
          marinas={marinas ?? []}
          userPosition={position}
          selectedMarinaId={selectedMarinaId}
          onSelect={handleSelect}
          onRequestLocation={requestGeo}
        />
      )}

      {/* List view */}
      {!isLoading && view === "list" && (
        <div className="space-y-1.5 max-h-[50vh] overflow-y-auto" role="listbox" aria-label="Select pickup marina">
          <AnimatePresence>
            {marinasWithDistance.map((marina, i) => {
              const isSelected = marina.id === selectedMarinaId;

              return (
                <motion.div
                  key={marina.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15, delay: i * 0.03 }}
                  layout
                >
                  <button
                    role="option"
                    aria-selected={isSelected}
                    className={`flex w-full items-center gap-3 rounded-xl border-2 px-3 py-3 min-h-[44px] text-left transition-colors ${
                      isSelected
                        ? "border-[var(--color-ocean)] bg-[var(--color-ocean)]/10"
                        : "border-border bg-card hover:bg-muted/50"
                    }`}
                    onClick={() => handleSelect(marina)}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        isSelected
                          ? "bg-[var(--color-ocean)] text-white"
                          : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                      }`}
                    >
                      {isSelected ? <Check className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {marina.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {[marina.city, marina.country].filter(Boolean).join(", ")}
                      </p>
                    </div>

                    {marina.distance !== undefined && (
                      <div className="shrink-0 text-right">
                        <p className="text-xs font-semibold text-foreground">
                          {marina.distance.toFixed(1)} km
                        </p>
                        {marina.eta && (
                          <p className="text-[10px] text-muted-foreground">
                            ~{marina.eta}
                          </p>
                        )}
                      </div>
                    )}
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {marinasWithDistance.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {filter
                ? "No marinas found"
                : "Enable location or search to find marinas"}
            </p>
          )}
        </div>
      )}

      {/* Selected marina summary */}
      {selectedMarinaId && marinasWithDistance.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-xl bg-[var(--color-ocean)]/10 border border-[var(--color-ocean)]/30 px-3 py-2"
        >
          <Check className="h-4 w-4 shrink-0 text-[var(--color-ocean)]" />
          <p className="text-xs text-foreground">
            <strong>{marinasWithDistance.find((m) => m.id === selectedMarinaId)?.name}</strong>
            {" selected for pickup"}
          </p>
        </motion.div>
      )}
    </div>
  );
}
