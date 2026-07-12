import { useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import { LocateFixed } from "lucide-react";

// Default Leaflet marker icons reference images that don't resolve correctly
// under Vite's bundler; point them at the CDN copies explicitly.
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface MapPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
  height?: string;
}

function ClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function RecenterButton({ onLocate }: { onLocate: (lat: number, lng: number) => void }) {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  const handleClick = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        onLocate(latitude, longitude);
        map.setView([latitude, longitude], 15);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="absolute bottom-3 right-3 z-[400] flex items-center gap-1.5 rounded-full bg-white dark:bg-brand-950 shadow-card px-3 py-2 text-xs font-semibold text-brand-700 dark:text-brand-200 hover:bg-brand-50 dark:hover:bg-brand-900"
    >
      <LocateFixed className="h-3.5 w-3.5" />
      {locating ? "Locating…" : "Use my location"}
    </button>
  );
}

export function MapPicker({ latitude, longitude, onChange, height = "280px" }: MapPickerProps) {
  const center: [number, number] = [latitude ?? 13.0827, longitude ?? 80.2707]; // default: Chennai

  const handleChange = useCallback((lat: number, lng: number) => onChange(lat, lng), [onChange]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-brand-200 dark:border-brand-800" style={{ height }}>
      <MapContainer center={center} zoom={latitude ? 14 : 11} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onChange={handleChange} />
        {latitude !== null && longitude !== null && (
          <Marker position={[latitude, longitude]} icon={markerIcon} />
        )}
        <RecenterButton onLocate={handleChange} />
      </MapContainer>
    </div>
  );
}
