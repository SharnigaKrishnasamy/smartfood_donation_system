import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Donation } from "../types";

const foodIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const selfIcon = new L.DivIcon({
  className: "",
  html: `<div style="width:16px;height:16px;border-radius:50%;background:#3a9958;border:3px solid white;box-shadow:0 0 0 2px #3a9958;"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

interface NearbyMapProps {
  donations: Donation[];
  center?: [number, number];
  height?: string;
  onSelect?: (donation: Donation) => void;
  volunteerPosition?: [number, number] | null;
}

export function NearbyMap({ donations, center, height = "360px", onSelect, volunteerPosition }: NearbyMapProps) {
  const mapCenter: [number, number] =
    center ??
    (donations.length > 0 ? [donations[0].latitude, donations[0].longitude] : [13.0827, 80.2707]);

  return (
    <div className="rounded-xl overflow-hidden border border-brand-200 dark:border-brand-800" style={{ height }}>
      <MapContainer center={mapCenter} zoom={12} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {center && <Marker position={center} icon={selfIcon} />}
        {volunteerPosition && <Marker position={volunteerPosition} icon={selfIcon} />}
        {donations.map((d) => (
          <Marker
            key={d.id}
            position={[d.latitude, d.longitude]}
            icon={foodIcon}
            eventHandlers={onSelect ? { click: () => onSelect(d) } : undefined}
          >
            <Popup>
              <strong>{d.food_name}</strong>
              <br />
              {d.quantity} {d.quantity_unit}
              {d.distance_km != null && (
                <>
                  <br />
                  {d.distance_km} km away
                </>
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
