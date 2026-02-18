"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import type { Marina } from "@/types";

interface UseMarinasOptions {
  query?: string;
  lat?: number;
  lng?: number;
  radius?: number;
}

export function useMarinas(opts: UseMarinasOptions = {}) {
  const { query, lat, lng, radius } = opts;

  return useQuery<Marina[]>({
    queryKey: ["marinas", query ?? "", lat, lng, radius],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (lat != null && lng != null) {
        params.set("lat", String(lat));
        params.set("lng", String(lng));
      }
      if (radius) params.set("r", String(radius));
      const res = await fetch(`/api/marinas?${params}`);
      const json = await res.json();
      return json.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpsertMarina() {
  return useMutation({
    mutationFn: async (marina: Omit<Marina, "id"> & { id?: string }) => {
      const res = await fetch("/api/marinas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(marina),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      return json.data as Marina;
    },
  });
}

export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function estimateETA(distanceKm: number, speedKmh = 20): string {
  const minutes = Math.round((distanceKm / speedKmh) * 60);
  if (minutes < 1) return "< 1 min";
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }
  return `${minutes} min`;
}
