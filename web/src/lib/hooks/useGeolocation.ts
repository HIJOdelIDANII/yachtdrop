"use client";

import { useState, useEffect, useCallback } from "react";

interface GeoPosition {
  lat: number;
  lng: number;
}

export function useGeolocation() {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(() => {
    if (typeof window === "undefined") return;

    if (!navigator.geolocation) {
      setError("Geolocation not supported by your browser");
      return;
    }

    if (location.protocol !== "https:" && location.hostname !== "localhost") {
      setError("Location requires HTTPS");
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      (err) => {
        const messages: Record<number, string> = {
          1: "Location permission denied",
          2: "Position unavailable",
          3: "Location request timed out",
        };
        setError(messages[err.code] || err.message);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 }
    );
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !navigator.permissions) return;
    navigator.permissions
      .query({ name: "geolocation" })
      .then((result) => {
        if (result.state === "granted") request();
      })
      .catch(() => {});
  }, [request]);

  return { position, loading, error, request };
}
