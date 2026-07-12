import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { VolunteerAPI } from "../../services/endpoints";
import { Donation } from "../../types";
import { StatusBadge } from "../../components/StatusBadge";
import { EmptyState } from "../../components/EmptyState";
import { LoadingScreen } from "../../components/LoadingScreen";
import { useToast } from "../../context/ToastContext";
import { apiErrorMessage } from "../../services/api";

interface AssignmentRow {
  id: number;
  status: string;
  assigned_at?: string | null;
  picked_up_at?: string | null;
  delivered_at?: string | null;
  donation: Donation | null;
}

export function VolunteerHistoryPage() {
  const { show } = useToast();
  const [history, setHistory] = useState<AssignmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    VolunteerAPI.history()
      .then((resp: any) => setHistory(resp.data.history))
      .catch((err) => show(apiErrorMessage(err), "error"))
      .finally(() => setLoading(false));
  }, [show]);

  if (loading) return <LoadingScreen label="Loading history…" />;

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Volunteer</p>
        <h1 className="text-2xl font-display font-semibold text-ink dark:text-brand-50">Pickup history</h1>
      </div>

      {history.length === 0 ? (
        <EmptyState icon={History} title="No pickups yet" />
      ) : (
        <div className="space-y-3">
          {history.map((a) => (
            <div key={a.id} className="card p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-ink dark:text-brand-50">{a.donation?.food_name}</p>
                <p className="text-xs text-brand-500">
                  {a.donation?.donor_info?.name} → {a.donation?.ngo_info?.organization_name || a.donation?.ngo_info?.name}
                </p>
              </div>
              {a.donation && <StatusBadge status={a.donation.status} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
