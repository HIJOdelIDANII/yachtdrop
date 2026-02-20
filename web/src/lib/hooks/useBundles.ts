"use client";

import { useQuery } from "@tanstack/react-query";
import type { Bundle } from "@/types";

export function useBundles() {
  return useQuery<Bundle[]>({
    queryKey: ["bundles"],
    queryFn: async () => {
      const res = await fetch("/api/bundles");
      if (!res.ok) throw new Error(`Bundles fetch failed: ${res.status}`);
      const json = await res.json();
      return json.data;
    },
    staleTime: 10 * 60 * 1000,
  });
}
