"use client";

import dynamic from "next/dynamic";

const LeafletPreview = dynamic(() => import("./LeafletPreview"), { ssr: false });

interface MapPreviewProps {
  lat: number;
  lng: number;
  name?: string;
  className?: string;
}

export function MapPreview({ lat, lng, name, className = "" }: MapPreviewProps) {
  const externalUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=14/${lat}/${lng}`;

  return (
    <div className={`overflow-hidden rounded-xl border border-border ${className}`}>
      <div className="h-40 w-full">
        <LeafletPreview lat={lat} lng={lng} name={name} />
      </div>
      <a
        href={externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full bg-muted/50 py-1.5 text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        Open in full map →
      </a>
    </div>
  );
}
