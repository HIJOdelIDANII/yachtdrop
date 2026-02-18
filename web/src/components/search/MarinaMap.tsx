"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Marina, MarinaWithDistance } from "@/types";
import { haversineDistance, estimateETA } from "@/lib/hooks/useMarinas";
import { Button } from "@/components/ui/button";
import { MapPin, X, Route, Locate, Anchor } from "lucide-react";
import dynamic from "next/dynamic";

// ── Lazy-load Leaflet (no SSR) ───────────────────────────────────
const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false });

interface MarinaMapProps {
  marinas: Marina[];
  userPosition?: { lat: number; lng: number } | null;
  selectedMarinaId?: string | null;
  onSelect: (marina: Marina) => void;
  onRequestLocation?: () => void;
  className?: string;
}

export function MarinaMap({
  marinas,
  userPosition,
  selectedMarinaId,
  onSelect,
  onRequestLocation,
  className = "",
}: MarinaMapProps) {
  const [showRoute, setShowRoute] = useState(false);
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  const selectedMarina = useMemo(
    () => marinas.find((m) => m.id === selectedMarinaId) ?? null,
    [marinas, selectedMarinaId]
  );

  // Compute distances for all marinas
  const marinasWithDistance = useMemo<MarinaWithDistance[]>(() => {
    return marinas
      .filter((m) => m.lat && m.lng)
      .map((m) => {
        if (userPosition && m.lat && m.lng) {
          const dist = haversineDistance(
            userPosition.lat,
            userPosition.lng,
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
  }, [marinas, userPosition]);

  const nearestMarina = marinasWithDistance[0] ?? null;

  // ── Fetch route from OSRM (free, no API key) ─────────────────
  const fetchRoute = useCallback(
    async (marina: Marina) => {
      if (!userPosition || !marina.lat || !marina.lng) return;

      setLoadingRoute(true);
      setRouteCoords(null);
      setRouteInfo(null);

      try {
        // OSRM public demo server — boat/car routes
        const url = `https://router.project-osrm.org/route/v1/driving/${userPosition.lng},${userPosition.lat};${Number(marina.lng)},${Number(marina.lat)}?overview=full&geometries=geojson`;

        const res = await fetch(url);
        if (!res.ok) throw new Error("Routing failed");

        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coords: [number, number][] = route.geometry.coordinates.map(
            (c: [number, number]) => [c[1], c[0]] // GeoJSON is [lng, lat], Leaflet wants [lat, lng]
          );
          setRouteCoords(coords);

          const distKm = (route.distance / 1000).toFixed(1);
          const durMin = Math.round(route.duration / 60);
          setRouteInfo({
            distance: `${distKm} km`,
            duration: durMin >= 60
              ? `${Math.floor(durMin / 60)}h ${durMin % 60}min`
              : `${durMin} min`,
          });
          setShowRoute(true);
        }
      } catch (err) {
        console.error("Route fetch error:", err);
        // Fallback: draw straight line
        setRouteCoords([
          [userPosition.lat, userPosition.lng],
          [Number(marina.lat), Number(marina.lng)],
        ]);
        const dist = haversineDistance(
          userPosition.lat,
          userPosition.lng,
          Number(marina.lat),
          Number(marina.lng)
        );
        setRouteInfo({
          distance: `${dist.toFixed(1)} km (straight)`,
          duration: estimateETA(dist),
        });
        setShowRoute(true);
      } finally {
        setLoadingRoute(false);
      }
    },
    [userPosition]
  );

  // Auto-fetch route when marina is selected
  useEffect(() => {
    if (selectedMarina && userPosition) {
      fetchRoute(selectedMarina);
    } else {
      setShowRoute(false);
      setRouteCoords(null);
      setRouteInfo(null);
    }
  }, [selectedMarina, userPosition, fetchRoute]);

  // Default center: Mediterranean
  const defaultCenter: [number, number] = userPosition
    ? [userPosition.lat, userPosition.lng]
    : [39.5, 2.5]; // Mallorca

  const defaultZoom = userPosition ? 10 : 6;

  return (
    <div className={`relative overflow-hidden rounded-xl border border-border ${className}`}>
      {/* Map */}
      <div className="h-[280px] w-full" style={{ touchAction: "none" }}>
        <LeafletMap
          center={defaultCenter}
          zoom={defaultZoom}
          marinas={marinasWithDistance}
          userPosition={userPosition}
          selectedMarinaId={selectedMarinaId}
          nearestMarinaId={nearestMarina?.id}
          routeCoords={showRoute ? routeCoords : null}
          onMarinaClick={onSelect}
        />
      </div>

      {/* Map controls overlay */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
        {/* Locate me button */}
        {!userPosition && onRequestLocation && (
          <Button
            size="icon"
            variant="secondary"
            className="h-10 w-10 rounded-xl bg-card/90 shadow-md backdrop-blur"
            onClick={onRequestLocation}
            aria-label="Find my location"
          >
            <Locate className="h-4 w-4" />
          </Button>
        )}

        {/* Route to nearest */}
        {userPosition && nearestMarina && !selectedMarinaId && (
          <Button
            size="sm"
            className="rounded-xl bg-[var(--color-ocean)] text-white shadow-md"
            onClick={() => onSelect(nearestMarina)}
          >
            <Anchor className="mr-1 h-3.5 w-3.5" />
            Nearest
          </Button>
        )}
      </div>

      {/* Route info bar */}
      <AnimatePresence>
        {showRoute && routeInfo && selectedMarina && (
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute bottom-0 inset-x-0 z-[1000] bg-card/95 backdrop-blur border-t border-border px-4 py-3"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {selectedMarina.name}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Route className="h-3 w-3" />
                    {routeInfo.distance}
                  </span>
                  <span>~{routeInfo.duration}</span>
                  {selectedMarina.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {selectedMarina.city}
                    </span>
                  )}
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0"
                onClick={() => {
                  setShowRoute(false);
                  setRouteCoords(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading route overlay */}
      {loadingRoute && (
        <div className="absolute inset-0 z-[1001] flex items-center justify-center bg-background/30 backdrop-blur-sm">
          <div className="flex items-center gap-2 rounded-xl bg-card px-4 py-2 shadow-lg">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-ocean)] border-t-transparent" />
            <span className="text-sm text-foreground">Loading route...</span>
          </div>
        </div>
      )}
    </div>
  );
}
