import { useEffect, useState } from "react";
import { Map as MapIcon, List, Check, X } from "lucide-react";
import { NgoAPI } from "../../services/endpoints";
import { Donation, FOOD_CATEGORIES } from "../../types";
import { DonationCard } from "../../components/DonationCard";
import { NearbyMap } from "../../components/NearbyMap";
import { EmptyState } from "../../components/EmptyState";
import { LoadingScreen } from "../../components/LoadingScreen";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { apiErrorMessage } from "../../services/api";

export function NgoNearbyPage() {
  const { user } = useAuth();
  const { show } = useToast();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "map">("list");
  const [radius, setRadius] = useState(10);
  const [category, setCategory] = useState("");
  const [vegOnly, setVegOnly] = useState(false);

  const load = () => {
    setLoading(true);
    NgoAPI.nearby({ radius, category: category || undefined, veg_only: vegOnly || undefined })
      .then((resp) => setDonations(resp.data.donations))
      .catch((err) => show(apiErrorMessage(err), "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radius, category, vegOnly]);

  const handleAccept = async (id: number) => {
    try {
      await NgoAPI.accept(id);
      show("Donation accepted! The donor has been notified.", "success");
      load();
    } catch (err) {
      show(apiErrorMessage(err), "error");
    }
  };

  const handleReject = async (id: number) => {
    try {
      await NgoAPI.reject(id);
      show("Marked as not suitable", "info");
      load();
    } catch (err) {
      show(apiErrorMessage(err), "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">NGO</p>
          <h1 className="text-2xl font-display font-semibold text-ink dark:text-brand-50">Nearby donations</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setView("list")} className={`btn-secondary ${view === "list" ? "ring-2 ring-brand-500" : ""}`}><List className="h-4 w-4" /> List</button>
          <button onClick={() => setView("map")} className={`btn-secondary ${view === "map" ? "ring-2 ring-brand-500" : ""}`}><MapIcon className="h-4 w-4" /> Map</button>
        </div>
      </div>

      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <label className="text-sm font-medium text-brand-700 dark:text-brand-300">
          Radius:
          <select className="input inline-block w-auto ml-2" value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
            {[5, 10, 15, 25, 50].map((r) => <option key={r} value={r}>{r} km</option>)}
          </select>
        </label>
        <select className="input w-auto" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {FOOD_CATEGORIES.map((c) => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm font-medium text-brand-700 dark:text-brand-300">
          <input type="checkbox" checked={vegOnly} onChange={(e) => setVegOnly(e.target.checked)} className="rounded" />
          Veg only
        </label>
      </div>

      {loading ? (
        <LoadingScreen label="Finding nearby donations…" />
      ) : donations.length === 0 ? (
        <EmptyState title="No donations nearby" description="Try increasing the radius or check back soon." />
      ) : view === "map" ? (
        <NearbyMap
          donations={donations}
          center={user?.latitude && user?.longitude ? [user.latitude, user.longitude] : undefined}
          height="480px"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {donations.map((d) => (
            <DonationCard
              key={d.id}
              donation={d}
              actions={
                <>
                  <button onClick={() => handleAccept(d.id)} className="btn-primary text-xs flex-1"><Check className="h-3.5 w-3.5" /> Accept</button>
                  <button onClick={() => handleReject(d.id)} className="btn-ghost text-xs flex-1"><X className="h-3.5 w-3.5" /> Skip</button>
                </>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
