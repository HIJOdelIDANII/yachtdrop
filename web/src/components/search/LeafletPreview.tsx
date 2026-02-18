"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const pinIcon = L.divIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="#00B4D8" stroke="white" stroke-width="1.5">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3" fill="white" stroke="#00B4D8" stroke-width="1.5"/>
  </svg>`,
  className: "custom-marker",
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

interface LeafletPreviewProps {
  lat: number;
  lng: number;
  name?: string;
}

export default function LeafletPreview({ lat, lng, name }: LeafletPreviewProps) {
  return (
    <>
      <style>{`
        .custom-marker { background: none !important; border: none !important; }
      `}</style>
      <MapContainer
        center={[lat, lng]}
        zoom={14}
        className="h-full w-full z-0"
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={[lat, lng]} icon={pinIcon}>
          {name && (
            <Popup>
              <span style={{ fontSize: 12, fontWeight: 600 }}>{name}</span>
            </Popup>
          )}
        </Marker>
      </MapContainer>
    </>
  );
}
