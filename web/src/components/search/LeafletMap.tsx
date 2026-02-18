"use client";

import { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import type { MarinaWithDistance } from "@/types";
import type { Marina } from "@/types";
import "leaflet/dist/leaflet.css";

// ── Custom marker icons ──────────────────────────────────────────
// SVG-based icons so we don't need external image files

function createSvgIcon(color: string, size: number, isSelected = false) {
  const scale = isSelected ? 1.3 : 1;
  const s = Math.round(size * scale);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="1.5">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3" fill="white" stroke="${color}" stroke-width="1.5"/>
    </svg>`;

  return L.divIcon({
    html: svg,
    className: "custom-marker",
    iconSize: [s, s],
    iconAnchor: [s / 2, s],
    popupAnchor: [0, -s],
  });
}

function createUserIcon() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="8" fill="#00B4D8" stroke="white" stroke-width="3"/>
      <circle cx="10" cy="10" r="3" fill="white"/>
    </svg>`;

  return L.divIcon({
    html: svg,
    className: "user-marker",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

const marinaIcon = createSvgIcon("#16a34a", 28); // green
const selectedIcon = createSvgIcon("#00B4D8", 28, true); // ocean blue, bigger
const nearestIcon = createSvgIcon("#f59e0b", 28); // amber
const userIcon = createUserIcon();

// ── Map view updater ─────────────────────────────────────────────
function MapUpdater({
  center,
  zoom,
  fitBounds,
}: {
  center?: [number, number];
  zoom?: number;
  fitBounds?: L.LatLngBoundsExpression;
}) {
  const map = useMap();

  useEffect(() => {
    if (fitBounds) {
      map.fitBounds(fitBounds, { padding: [40, 40], maxZoom: 14 });
    } else if (center) {
      map.setView(center, zoom ?? map.getZoom(), { animate: true });
    }
  }, [map, center, zoom, fitBounds]);

  return null;
}

// ── Main map component ───────────────────────────────────────────
interface LeafletMapProps {
  center: [number, number];
  zoom: number;
  marinas: MarinaWithDistance[];
  userPosition?: { lat: number; lng: number } | null;
  selectedMarinaId?: string | null;
  nearestMarinaId?: string | null;
  routeCoords?: [number, number][] | null;
  onMarinaClick: (marina: Marina) => void;
}

export default function LeafletMap({
  center,
  zoom,
  marinas,
  userPosition,
  selectedMarinaId,
  nearestMarinaId,
  routeCoords,
  onMarinaClick,
}: LeafletMapProps) {
  const mapRef = useRef<L.Map | null>(null);

  // Compute fit bounds when route is shown
  const fitBounds = routeCoords && routeCoords.length >= 2
    ? L.latLngBounds(routeCoords.map((c) => L.latLng(c[0], c[1])))
    : undefined;

  return (
    <>
      {/* Global Leaflet CSS overrides */}
      <style>{`
        .custom-marker, .user-marker {
          background: none !important;
          border: none !important;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          padding: 0 !important;
          overflow: hidden;
        }
        .leaflet-popup-content {
          margin: 0 !important;
          min-width: 180px;
        }
        .leaflet-popup-close-button {
          top: 6px !important;
          right: 6px !important;
        }
        .marina-popup {
          padding: 10px 14px;
        }
        .marina-popup h3 {
          font-size: 13px;
          font-weight: 600;
          margin: 0 0 2px;
          color: #0A2540;
        }
        .marina-popup p {
          font-size: 11px;
          color: #6b7280;
          margin: 0;
        }
        .marina-popup .distance {
          font-size: 11px;
          font-weight: 600;
          color: #00B4D8;
          margin-top: 4px;
        }
        .marina-popup .select-btn {
          display: block;
          width: 100%;
          margin-top: 8px;
          padding: 6px 0;
          font-size: 12px;
          font-weight: 600;
          text-align: center;
          color: white;
          background: #00B4D8;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          min-height: 36px;
        }
        .marina-popup .select-btn:hover {
          background: #0099b8;
        }
      `}</style>

      <MapContainer
        center={center}
        zoom={zoom}
        className="h-full w-full z-0"
        zoomControl={false}
        ref={mapRef}
        attributionControl={true}
        scrollWheelZoom={true}
        dragging={true}
      >
        {/* OSM tiles — completely free */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* View updater */}
        <MapUpdater
          center={center}
          zoom={zoom}
          fitBounds={fitBounds}
        />

        {/* User location marker */}
        {userPosition && (
          <>
            <Circle
              center={[userPosition.lat, userPosition.lng]}
              radius={200}
              pathOptions={{
                color: "#00B4D8",
                fillColor: "#00B4D8",
                fillOpacity: 0.1,
                weight: 1,
              }}
            />
            <Marker
              position={[userPosition.lat, userPosition.lng]}
              icon={userIcon}
            >
              <Popup>
                <div className="marina-popup">
                  <h3>Your location</h3>
                </div>
              </Popup>
            </Marker>
          </>
        )}

        {/* Marina markers */}
        {marinas.map((marina) => {
          if (!marina.lat || !marina.lng) return null;

          const isSelected = marina.id === selectedMarinaId;
          const isNearest = marina.id === nearestMarinaId && !selectedMarinaId;

          const icon = isSelected
            ? selectedIcon
            : isNearest
              ? nearestIcon
              : marinaIcon;

          return (
            <Marker
              key={marina.id}
              position={[Number(marina.lat), Number(marina.lng)]}
              icon={icon}
              eventHandlers={{
                click: () => onMarinaClick(marina),
              }}
            >
              <Popup>
                <div className="marina-popup">
                  <h3>{marina.name}</h3>
                  <p>
                    {[marina.city, marina.country].filter(Boolean).join(", ")}
                  </p>
                  {marina.distance !== undefined && (
                    <p className="distance">
                      {marina.distance.toFixed(1)} km · ~{marina.eta}
                    </p>
                  )}
                  <button
                    className="select-btn"
                    onClick={() => onMarinaClick(marina)}
                  >
                    {isSelected ? "✓ Selected" : "Select for Pickup"}
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Route polyline */}
        {routeCoords && routeCoords.length >= 2 && (
          <Polyline
            positions={routeCoords}
            pathOptions={{
              color: "#00B4D8",
              weight: 4,
              opacity: 0.8,
              dashArray: "8 6",
            }}
          />
        )}
      </MapContainer>
    </>
  );
}
