"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix missing marker icons in leaflet with next.js
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

interface MapPickerProps {
  latitude: number;
  longitude: number;
  radius?: number;
  onChange: (lat: number, lng: number) => void;
}

function LocationMarker({ position, onChange }: { position: [number, number], onChange: (lat: number, lng: number) => void }) {
  const map = useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });

  useEffect(() => {
    if (position[0] && position[1]) {
      map.flyTo(position, map.getZoom());
    }
  }, [position[0], position[1], map]);

  return position ? <Marker position={position} icon={icon} /> : null;
}

export default function MapPicker({ latitude, longitude, radius = 100, onChange }: MapPickerProps) {
  const [mounted, setMounted] = useState(false);
  const position: [number, number] = [latitude || -6.2088, longitude || 106.8456];

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-[300px] w-full bg-muted animate-pulse rounded-xl" />;
  }

  return (
    <div className="h-[300px] w-full rounded-xl overflow-hidden border border-border z-0 relative">
      <MapContainer
        center={position}
        zoom={15}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={position} onChange={onChange} />
        {radius > 0 && <Circle center={position} radius={radius} pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.2 }} />}
      </MapContainer>
      <div className="absolute top-2 right-2 z-[1000] bg-background/90 backdrop-blur text-xs px-2 py-1 rounded shadow-sm border border-border">
        Klik peta untuk memindahkan lokasi
      </div>
    </div>
  );
}
