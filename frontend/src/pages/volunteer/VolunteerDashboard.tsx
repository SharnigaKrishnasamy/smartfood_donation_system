import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Truck, CheckCircle2, MapPinned, Navigation } from "lucide-react";
import { VolunteerAPI } from "../../services/endpoints";
import { Donation } from "../../types";
import { StatCard } from "../../components/StatCard";
import { StatusBadge } from "../../components/StatusBadge";
import { NearbyMap } from "../../components/NearbyMap";
import { EmptyState } from "../../components/EmptyState";
import { LoadingScreen } from "../../components/LoadingScreen";
import { InlineSpinner } from "../../components/LoadingScreen";
import { useToast } from "../../context/ToastContext";
import { apiErrorMessage } from "../../services/api";
import { getSocket } from "../../services/socket";

interface AssignmentRow {
  id: number;
  status: string;
  donation: Donation | null;
}

export function VolunteerDashboard() {
  const { show } = useToast();
  const [history, setHistory] = useState<AssignmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    VolunteerAPI.history()
      .then((resp: any) => setHistory(resp.data.history))
      .catch((err) => show(apiErrorMessage(err), "error"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  // Share live GPS location for active donation pickups so donor/NGO can watch on the map
  useEffect(() => {
    const active = history.filter((h) => h.status !== "delivered" && h.status !== "cancelled");
    if (active.length === 0 || !navigator.geolocation) return;

    const watchers = active.map((a) =>
      navigator.geolocation.watchPosition((pos) => {
        const socket = getSocket();
        socket?.emit("volunteer_location_update", {
          donation_id: a.donation?.id,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      })
    );
    return () => watchers.forEach((id) => navigator.geolocation.clearWatch(id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history.length]);

  const active = history.filter((h) => h.status !== "delivered" && h.status !== "cancelled");
  const completed = history.filter((h) => h.status === "delivered");

  const handleConfirmPickup = async (donationId: number) => {
    setActionLoading(donationId);
    try {
      await VolunteerAPI.confirmPickup(donationId);
      show("Pickup confirmed", "success");
      load();
    } catch (err) {
      show(apiErrorMessage(err), "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmDelivery = async (donationId: number) => {
    setActionLoading(donationId);
    try {
      await VolunteerAPI.confirmDelivery(donationId);
      show("Delivery confirmed. Thank you!", "success");
      load();
    } catch (err) {
      show(apiErrorMessage(err), "error");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <LoadingScreen label="Loading your pickups…" />;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Volunteer</p>
          <h1 className="text-2xl font-display font-semibold text-ink dark:text-brand-50">Your pickups</h1>
        </div>
        <Link to="/volunteer/pickups" className="btn-primary">
          <Truck className="h-4 w-4" /> Find available pickups
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard icon={Truck} label="Active" value={active.length} accent="sky" />
        <StatCard icon={CheckCircle2} label="Completed" value={completed.length} accent="brand" />
        <StatCard icon={MapPinned} label="Total Assignments" value={history.length} accent="amber" />
      </div>

      <div>
        <h2 className="font-display font-semibold text-lg text-ink dark:text-brand-50 mb-3">Active assignments</h2>
        {active.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="No active pickups"
            description="Find available pickups nearby and start helping deliver food."
            action={<Link to="/volunteer/pickups" className="btn-primary">Find pickups</Link>}
          />
        ) : (
          <div className="space-y-4">
            {active.map((a) => {
              const d = a.donation;
              if (!d) return null;
              return (
                <div key={a.id} className="card p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display font-semibold text-ink dark:text-brand-50">{d.food_name}</h3>
                      <p className="text-sm text-brand-600 dark:text-brand-300">{d.quantity} {d.quantity_unit}</p>
                    </div>
                    <StatusBadge status={d.status} />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-brand-50 dark:bg-brand-950/50 p-3">
                      <p className="text-xs font-semibold text-brand-500 uppercase">Pickup from</p>
                      <p className="text-ink dark:text-brand-50">{d.donor_info?.name}</p>
                      <p className="text-brand-600 dark:text-brand-300">{d.pickup_address}</p>
                      <a href={`tel:${d.contact_phone}`} className="text-brand-700 dark:text-brand-300 underline">{d.contact_phone}</a>
                    </div>
                    <div className="rounded-xl bg-brand-50 dark:bg-brand-950/50 p-3">
                      <p className="text-xs font-semibold text-brand-500 uppercase">Deliver to</p>
                      <p className="text-ink dark:text-brand-50">{d.ngo_info?.organization_name || d.ngo_info?.name}</p>
                      <p className="text-brand-600 dark:text-brand-300">{d.ngo_info?.address}</p>
                    </div>
                  </div>

                  <NearbyMap donations={[d]} height="220px" />

                  <div className="flex gap-2">
                    <a
                      href={`https://www.openstreetmap.org/directions?to=${d.latitude},${d.longitude}`}
                      target="_blank" rel="noreferrer"
                      className="btn-secondary text-xs flex-1"
                    >
                      <Navigation className="h-3.5 w-3.5" /> Navigate
                    </a>
                    {d.status === "assigned" && (
                      <button onClick={() => handleConfirmPickup(d.id)} disabled={actionLoading === d.id} className="btn-primary text-xs flex-1">
                        {actionLoading === d.id && <InlineSpinner />} Confirm pickup
                      </button>
                    )}
                    {d.status === "picked_up" && (
                      <button onClick={() => handleConfirmDelivery(d.id)} disabled={actionLoading === d.id} className="btn-primary text-xs flex-1">
                        {actionLoading === d.id && <InlineSpinner />} Confirm delivery
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
