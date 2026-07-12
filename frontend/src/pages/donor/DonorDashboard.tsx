import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PackagePlus, Clock, CheckCircle2, Truck, Package } from "lucide-react";
import { DonorAPI } from "../../services/endpoints";
import { Donation } from "../../types";
import { StatCard } from "../../components/StatCard";
import { DonationCard } from "../../components/DonationCard";
import { EmptyState } from "../../components/EmptyState";
import { LoadingScreen } from "../../components/LoadingScreen";
import { useToast } from "../../context/ToastContext";
import { apiErrorMessage } from "../../services/api";

export function DonorDashboard() {
  const { show } = useToast();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    DonorAPI.list()
      .then((resp) => setDonations(resp.data.donations))
      .catch((err) => show(apiErrorMessage(err), "error"))
      .finally(() => setLoading(false));
  }, [show]);

  if (loading) return <LoadingScreen label="Loading your donations…" />;

  const active = donations.filter((d) => !["delivered", "cancelled", "expired", "rejected"].includes(d.status));
  const delivered = donations.filter((d) => d.status === "delivered");
  const totalServings = delivered.reduce((sum, d) => sum + d.quantity, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Donor</p>
          <h1 className="text-2xl font-display font-semibold text-ink dark:text-brand-50">Your impact so far</h1>
        </div>
        <Link to="/donor/new" className="btn-primary">
          <PackagePlus className="h-4 w-4" /> New Donation
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Total Donations" value={donations.length} />
        <StatCard icon={Clock} label="Active" value={active.length} accent="amber" />
        <StatCard icon={CheckCircle2} label="Delivered" value={delivered.length} accent="brand" />
        <StatCard icon={Truck} label="Total Quantity Saved" value={totalServings} hint="across delivered donations" accent="sky" />
      </div>

      <div>
        <h2 className="font-display font-semibold text-lg text-ink dark:text-brand-50 mb-3">Active donations</h2>
        {active.length === 0 ? (
          <EmptyState
            icon={PackagePlus}
            title="No active donations"
            description="List your surplus food and NGOs nearby will be notified instantly."
            action={<Link to="/donor/new" className="btn-primary">Create a donation</Link>}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {active.map((d) => <DonationCard key={d.id} donation={d} />)}
          </div>
        )}
      </div>
    </div>
  );
}
