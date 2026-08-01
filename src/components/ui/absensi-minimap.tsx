"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const iconUser = L.divIcon({
  className: "custom-marker",
  html: `<div style="background-color: #ef4444; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const iconOffice = L.divIcon({
  className: "custom-marker",
  html: `<div style="background-color: #3b82f6; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

interface MinimapProps {
  userPos: { lat: number; lng: number } | null;
  officePos: { lat: number; lng: number } | null;
  radius: number;
}

function MapUpdater({ userPos }: { userPos: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (userPos) {
      map.flyTo([userPos.lat, userPos.lng], 16, { animate: true, duration: 1.5 });
    }
  }, [userPos, map]);
  return null;
}

export default function AbsensiMinimap({ userPos, officePos, radius }: MinimapProps) {
  const [mounted, setMounted] = useState(false);
  const center: [number, number] = officePos ? [officePos.lat, officePos.lng] : [-6.2088, 106.8456];

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-full h-full bg-slate-100 dark:bg-slate-800 animate-pulse" />;
  }

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer
        center={userPos ? [userPos.lat, userPos.lng] : center}
        zoom={userPos ? 16 : 14}
        scrollWheelZoom={false}
        zoomControl={false}
        dragging={false}
        touchZoom={false}
        doubleClickZoom={false}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap'
        />
        <MapUpdater userPos={userPos} />
        {officePos && (
          <>
            <Marker position={[officePos.lat, officePos.lng]} icon={iconOffice} />
            <Circle
              center={[officePos.lat, officePos.lng]}
              radius={radius}
              pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.15, weight: 1 }}
            />
          </>
        )}
        {userPos && (
          <Marker position={[userPos.lat, userPos.lng]} icon={iconUser} />
        )}
      </MapContainer>
      {/* Legend */}
      <div className="absolute bottom-2 left-2 z-[400] bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-white" />
          <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300">Kantor</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-white" />
          <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300">Anda</span>
        </div>
      </div>
    </div>
  );
}