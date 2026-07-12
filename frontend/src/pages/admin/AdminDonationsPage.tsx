import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { AdminAPI } from "../../services/endpoints";
import { Donation, DonationStatus } from "../../types";
import { StatusBadge } from "../../components/StatusBadge";
import { EmptyState } from "../../components/EmptyState";
import { LoadingScreen } from "../../components/LoadingScreen";
import { useToast } from "../../context/ToastContext";
import { apiErrorMessage } from "../../services/api";

const FILTERS: { label: string; value: DonationStatus | "" }[] = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Accepted", value: "accepted" },
  { label: "Assigned", value: "assigned" },
  { label: "Picked Up", value: "picked_up" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Expired", value: "expired" },
];

export function AdminDonationsPage() {
  const { show } = useToast();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<DonationStatus | "">("");

  const load = () => {
    setLoading(true);
    AdminAPI.listDonations(filter || undefined)
      .then((resp) => setDonations(resp.data.donations))
      .catch((err) => show(apiErrorMessage(err), "error"))
      .finally(() => setLoading(false));
  };

  useEffect(load, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (id: number) => {
    if (!window.confirm("Permanently delete this donation?")) return;
    try {
      await AdminAPI.deleteDonation(id);
      show("Donation deleted", "success");
      load();
    } catch (err) {
      show(apiErrorMessage(err), "error");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Admin</p>
        <h1 className="text-2xl font-display font-semibold text-ink dark:text-brand-50">Manage donations</h1>
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
        <LoadingScreen label="Loading donations…" />
      ) : donations.length === 0 ? (
        <EmptyState title="No donations found" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-brand-500 border-b border-brand-100 dark:border-brand-900">
                <th className="px-4 py-3">Food</th>
                <th className="px-4 py-3">Donor</th>
                <th className="px-4 py-3">NGO</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((d) => (
                <tr key={d.id} className="border-b border-brand-50 dark:border-brand-900/60 last:border-0">
                  <td className="px-4 py-3 font-medium text-ink dark:text-brand-50">{d.food_name}</td>
                  <td className="px-4 py-3 text-brand-600 dark:text-brand-300">{d.donor_info?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-brand-600 dark:text-brand-300">{d.ngo_info?.organization_name || d.ngo_info?.name || "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(d.id)} className="btn-ghost text-xs px-2 py-1 text-red-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
