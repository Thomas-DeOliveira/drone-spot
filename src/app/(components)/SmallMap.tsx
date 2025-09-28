"use client";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";

type SmallMapProps = {
  latitude: number;
  longitude: number;
  className?: string;
};

const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const spotIcon = L.divIcon({
  className: "",
  html: `
    <span class="map-marker" style="width:28px;height:28px;">
      <span class="map-marker-dot"></span>
    </span>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

export default function SmallMap({ latitude, longitude, className }: SmallMapProps) {
  useEffect(() => {
    (L.Marker.prototype.options.icon as any) = defaultIcon;
  }, []);

  return (
    <div className={className}>
      <MapContainer
        center={[latitude, longitude]}
        zoom={12}
        scrollWheelZoom={false}
        dragging={true}
        className="h-60 w-full rounded-md overflow-hidden"
        attributionControl={false}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <Marker position={[latitude, longitude]} icon={spotIcon as any} />
      </MapContainer>
    </div>
  );
}


