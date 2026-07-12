import { Clock, MapPin, Leaf, Beef } from "lucide-react";
import { Donation } from "../types";
import { StatusBadge } from "./StatusBadge";
import { getApiBaseUrl } from "../services/apiConfig";

function timeUntil(iso: string) {
  const diffMs = new Date(iso).getTime() - Date.now();
  if (diffMs <= 0) return "Expired";
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 1) return `${Math.floor(diffMs / 60_000)}m left`;
  if (hours < 24) return `${hours}h left`;
  return `${Math.floor(hours / 24)}d left`;
}

interface DonationCardProps {
  donation: Donation;
  actions?: React.ReactNode;
  onClick?: () => void;
}

export function DonationCard({ donation, actions, onClick }: DonationCardProps) {
  const image = donation.images?.[0];
  const imageUrl = image ? `${getApiBaseUrl()}${image.url}` : null;

  return (
    <div
      onClick={onClick}
      className={`card overflow-hidden animate-fade-up ${onClick ? "cursor-pointer hover:shadow-glass hover:-translate-y-0.5 transition-all" : ""}`}
    >
      <div className="relative h-36 bg-brand-100 dark:bg-brand-900">
        {imageUrl ? (
          <img src={imageUrl} alt={donation.food_name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-brand-400">
            <Leaf className="h-8 w-8" />
          </div>
        )}
        <div className="absolute top-2 left-2">
          <StatusBadge status={donation.status} />
        </div>
        {donation.distance_km != null && (
          <div className="absolute top-2 right-2 rounded-full bg-white/90 dark:bg-ink/80 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:text-brand-200 flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {donation.distance_km} km
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-semibold text-ink dark:text-brand-50 leading-tight">
            {donation.food_name}
          </h3>
          {donation.is_veg ? (
            <Leaf className="h-4 w-4 shrink-0 text-brand-600 mt-0.5" aria-label="Vegetarian" />
          ) : (
            <Beef className="h-4 w-4 shrink-0 text-red-500 mt-0.5" aria-label="Non-vegetarian" />
          )}
        </div>

        <p className="mt-1 text-sm text-brand-600/90 dark:text-brand-300/80">
          {donation.quantity} {donation.quantity_unit}
        </p>

        <div className="mt-2 flex items-center gap-3 text-xs text-brand-500 dark:text-brand-400">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {timeUntil(donation.expiry_datetime)}
          </span>
          <span className="truncate flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{donation.pickup_address}</span>
          </span>
        </div>

        {actions && <div className="mt-4 flex gap-2" onClick={(e) => e.stopPropagation()}>{actions}</div>}
      </div>
    </div>
  );
}
