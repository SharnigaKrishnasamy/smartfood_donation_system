import { useState } from "react";
import { Search as SearchIcon, Building2, HeartHandshake } from "lucide-react";
import { SearchAPI } from "../services/endpoints";
import { Donation, User, FOOD_CATEGORIES } from "../types";
import { DonationCard } from "../components/DonationCard";
import { EmptyState } from "../components/EmptyState";
import { InlineSpinner } from "../components/LoadingScreen";
import { apiErrorMessage } from "../services/api";
import { useToast } from "../context/ToastContext";

type Tab = "donations" | "ngos" | "volunteers";

export function SearchPage() {
  const { show } = useToast();
  const [tab, setTab] = useState<Tab>("donations");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [minQuantity, setMinQuantity] = useState("");
  const [maxDistance, setMaxDistance] = useState("");
  const [loading, setLoading] = useState(false);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [people, setPeople] = useState<Partial<User>[]>([]);
  const [searched, setSearched] = useState(false);

  const runSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setSearched(true);
    try {
      if (tab === "donations") {
        const resp = await SearchAPI.donations({
          q, status: status || undefined, category: category || undefined,
          min_quantity: minQuantity || undefined, max_distance_km: maxDistance || undefined,
        });
        setDonations(resp.data.donations);
      } else if (tab === "ngos") {
        const resp = await SearchAPI.ngos(q);
        setPeople(resp.data.ngos);
      } else {
        const resp = await SearchAPI.volunteers(q);
        setPeople(resp.data.volunteers);
      }
    } catch (err) {
      show(apiErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Find</p>
        <h1 className="text-2xl font-display font-semibold text-ink dark:text-brand-50">Search</h1>
      </div>

      <div className="flex gap-2">
        {(["donations", "ngos", "volunteers"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setSearched(false); }}
            className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition-colors ${
              tab === t ? "bg-brand-600 text-white" : "bg-brand-50 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <form onSubmit={runSearch} className="card p-4 space-y-3">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-400" />
          <input
            className="input pl-9"
            placeholder={tab === "donations" ? "Search by food name…" : tab === "ngos" ? "Search NGOs…" : "Search volunteers…"}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {tab === "donations" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Any status</option>
              {["pending", "accepted", "assigned", "picked_up", "delivered", "cancelled", "expired"].map((s) => (
                <option key={s} value={s}>{s.replace("_", " ")}</option>
              ))}
            </select>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Any category</option>
              {FOOD_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.replace("_", " ")}</option>
              ))}
            </select>
            <input className="input" placeholder="Min quantity" type="number" value={minQuantity} onChange={(e) => setMinQuantity(e.target.value)} />
            <input className="input" placeholder="Max distance (km)" type="number" value={maxDistance} onChange={(e) => setMaxDistance(e.target.value)} />
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary">
          {loading && <InlineSpinner />}
          Search
        </button>
      </form>

      {!searched ? (
        <EmptyState icon={SearchIcon} title="Search Harvest Link" description="Results will appear here." />
      ) : tab === "donations" ? (
        donations.length === 0 ? (
          <EmptyState title="No matching donations" description="Try adjusting your filters." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {donations.map((d) => <DonationCard key={d.id} donation={d} />)}
          </div>
        )
      ) : people.length === 0 ? (
        <EmptyState title={`No ${tab} found`} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {people.map((p) => (
            <div key={p.id} className="card p-4 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-200">
                {tab === "ngos" ? <Building2 className="h-5 w-5" /> : <HeartHandshake className="h-5 w-5" />}
              </span>
              <div>
                <p className="font-semibold text-ink dark:text-brand-50">
                  {p.organization_name || p.name}
                </p>
                <p className="text-xs text-brand-500">{p.address || p.phone}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
