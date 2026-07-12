import { useEffect, useState } from "react";
import { ShieldCheck, Building2 } from "lucide-react";
import { AdminAPI } from "../../services/endpoints";
import { User } from "../../types";
import { EmptyState } from "../../components/EmptyState";
import { LoadingScreen } from "../../components/LoadingScreen";
import { useToast } from "../../context/ToastContext";
import { apiErrorMessage } from "../../services/api";

export function AdminNgoApprovalsPage() {
  const { show } = useToast();
  const [ngos, setNgos] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    AdminAPI.listUsers({ role: "ngo" })
      .then((resp) => setNgos(resp.data.users.filter((u) => !u.is_approved)))
      .catch((err) => show(apiErrorMessage(err), "error"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApprove = async (id: number) => {
    try {
      await AdminAPI.approveNgo(id);
      show("NGO approved", "success");
      load();
    } catch (err) {
      show(apiErrorMessage(err), "error");
    }
  };

  if (loading) return <LoadingScreen label="Loading approvals…" />;

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Admin</p>
        <h1 className="text-2xl font-display font-semibold text-ink dark:text-brand-50">NGO approvals</h1>
      </div>

      {ngos.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No pending approvals" description="New NGO registrations will appear here." />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {ngos.map((ngo) => (
            <div key={ngo.id} className="card p-5 flex items-start gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 shrink-0">
                <Building2 className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="font-semibold text-ink dark:text-brand-50">{ngo.organization_name}</p>
                <p className="text-xs text-brand-500">{ngo.registration_number || "No registration number provided"}</p>
                <p className="text-sm text-brand-600 dark:text-brand-300 mt-1">{ngo.email} · {ngo.phone}</p>
                <p className="text-sm text-brand-600/80 dark:text-brand-300/80">{ngo.address}</p>
                <button onClick={() => handleApprove(ngo.id)} className="btn-primary text-xs mt-3">
                  <ShieldCheck className="h-3.5 w-3.5" /> Approve NGO
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
