import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPinned, CheckCircle2, Clock, Truck } from "lucide-react";
import { NgoAPI } from "../../services/endpoints";
import { Donation } from "../../types";
import { StatCard } from "../../components/StatCard";
import { DonationCard } from "../../components/DonationCard";
import { EmptyState } from "../../components/EmptyState";
import { LoadingScreen } from "../../components/LoadingScreen";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { apiErrorMessage } from "../../services/api";

export function NgoDashboard() {
  const { user } = useAuth();
  const { show } = useToast();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    NgoAPI.myDonations()
      .then((resp) => setDonations(resp.data.donations))
      .catch((err) => show(apiErrorMessage(err), "error"))
      .finally(() => setLoading(false));
  }, [show]);

  if (loading) return <LoadingScreen label="Loading dashboard…" />;

  if (user && !user.is_approved) {
    return (
      <EmptyState
        icon={Clock}
        title="Approval pending"
        description="An admin needs to approve your NGO account before you can accept donations. This usually doesn't take long — check back soon."
      />
    );
  }

  const inProgress = donations.filter((d) => ["accepted", "assigned", "picked_up"].includes(d.status));
  const delivered = donations.filter((d) => d.status === "delivered");
  const totalReceived = delivered.reduce((sum, d) => sum + d.quantity, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">NGO</p>
          <h1 className="text-2xl font-display font-semibold text-ink dark:text-brand-50">
            {user?.organization_name || "Your"} dashboard
          </h1>
        </div>
        <Link to="/ngo/nearby" className="btn-primary">
          <MapPinned className="h-4 w-4" /> Browse nearby donations
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Truck} label="In Progress" value={inProgress.length} accent="sky" />
        <StatCard icon={CheckCircle2} label="Delivered" value={delivered.length} accent="brand" />
        <StatCard icon={Clock} label="Total Accepted" value={donations.length} accent="amber" />
        <StatCard icon={MapPinned} label="Quantity Received" value={totalReceived} accent="purple" />
      </div>

      <div>
        <h2 className="font-display font-semibold text-lg text-ink dark:text-brand-50 mb-3">In progress</h2>
        {inProgress.length === 0 ? (
          <EmptyState
            icon={MapPinned}
            title="Nothing in progress"
            description="Browse nearby donations to accept new ones."
            action={<Link to="/ngo/nearby" className="btn-primary">Browse nearby</Link>}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {inProgress.map((d) => <DonationCard key={d.id} donation={d} />)}
          </div>
        )}
      </div>
    </div>
  );
}
