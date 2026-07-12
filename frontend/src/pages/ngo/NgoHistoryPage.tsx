import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { NgoAPI } from "../../services/endpoints";
import { Donation, DonationStatus } from "../../types";
import { DonationCard } from "../../components/DonationCard";
import { EmptyState } from "../../components/EmptyState";
import { LoadingScreen } from "../../components/LoadingScreen";
import { useToast } from "../../context/ToastContext";
import { apiErrorMessage } from "../../services/api";

const FILTERS: { label: string; value: DonationStatus | "" }[] = [
  { label: "All", value: "" },
  { label: "Accepted", value: "accepted" },
  { label: "Assigned", value: "assigned" },
  { label: "Picked Up", value: "picked_up" },
  { label: "Delivered", value: "delivered" },
];

export function NgoHistoryPage() {
  const { show } = useToast();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<DonationStatus | "">("");

  useEffect(() => {
    setLoading(true);
    NgoAPI.myDonations(filter || undefined)
      .then((resp) => setDonations(resp.data.donations))
      .catch((err) => show(apiErrorMessage(err), "error"))
      .finally(() => setLoading(false));
  }, [filter, show]);

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">NGO</p>
        <h1 className="text-2xl font-display font-semibold text-ink dark:text-brand-50">History</h1>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              filter === f.value ? "bg-brand-600 text-white" : "bg-brand-50 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingScreen label="Loading history…" />
      ) : donations.length === 0 ? (
        <EmptyState icon={History} title="Nothing here yet" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {donations.map((d) => <DonationCard key={d.id} donation={d} />)}
        </div>
      )}
    </div>
  );
}
