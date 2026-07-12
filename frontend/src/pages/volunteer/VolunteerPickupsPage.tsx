import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Truck } from "lucide-react";
import { VolunteerAPI } from "../../services/endpoints";
import { Donation } from "../../types";
import { DonationCard } from "../../components/DonationCard";
import { EmptyState } from "../../components/EmptyState";
import { LoadingScreen } from "../../components/LoadingScreen";
import { useToast } from "../../context/ToastContext";
import { apiErrorMessage } from "../../services/api";

export function VolunteerPickupsPage() {
  const { show } = useToast();
  const navigate = useNavigate();
  const [pickups, setPickups] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [radius, setRadius] = useState(15);

  const load = () => {
    setLoading(true);
    VolunteerAPI.available({ radius })
      .then((resp) => setPickups(resp.data.pickups))
      .catch((err) => show(apiErrorMessage(err), "error"))
      .finally(() => setLoading(false));
  };

  useEffect(load, [radius]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAccept = async (id: number) => {
    try {
      await VolunteerAPI.acceptPickup(id);
      show("Pickup accepted! Head to your dashboard to track it.", "success");
      navigate("/volunteer");
    } catch (err) {
      show(apiErrorMessage(err), "error");
      load();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Volunteer</p>
          <h1 className="text-2xl font-display font-semibold text-ink dark:text-brand-50">Available pickups</h1>
        </div>
        <label className="text-sm font-medium text-brand-700 dark:text-brand-300">
          Radius:
          <select className="input inline-block w-auto ml-2" value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
            {[5, 10, 15, 25, 50].map((r) => <option key={r} value={r}>{r} km</option>)}
          </select>
        </label>
      </div>

      {loading ? (
        <LoadingScreen label="Finding pickups near you…" />
      ) : pickups.length === 0 ? (
        <EmptyState icon={Truck} title="No pickups available right now" description="Check back soon — new accepted donations appear here in real time." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pickups.map((d) => (
            <DonationCard
              key={d.id}
              donation={d}
              actions={
                <button onClick={() => handleAccept(d.id)} className="btn-primary text-xs flex-1">
                  Accept pickup
                </button>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
