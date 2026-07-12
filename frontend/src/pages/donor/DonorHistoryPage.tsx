import { useEffect, useState } from "react";
import { History, Trash2, XCircle, Pencil } from "lucide-react";
import { DonorAPI } from "../../services/endpoints";
import { Donation, DonationStatus } from "../../types";
import { DonationCard } from "../../components/DonationCard";
import { EmptyState } from "../../components/EmptyState";
import { LoadingScreen } from "../../components/LoadingScreen";
import { Modal } from "../../components/Modal";
import { useToast } from "../../context/ToastContext";
import { apiErrorMessage } from "../../services/api";

const STATUS_FILTERS: { label: string; value: DonationStatus | "" }[] = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Accepted", value: "accepted" },
  { label: "Assigned", value: "assigned" },
  { label: "Picked Up", value: "picked_up" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

export function DonorHistoryPage() {
  const { show } = useToast();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<DonationStatus | "">("");
  const [editing, setEditing] = useState<Donation | null>(null);
  const [editForm, setEditForm] = useState({ food_name: "", quantity: "", description: "" });

  const load = () => {
    setLoading(true);
    DonorAPI.list(filter || undefined)
      .then((resp) => setDonations(resp.data.donations))
      .catch((err) => show(apiErrorMessage(err), "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this donation? This can't be undone.")) return;
    try {
      await DonorAPI.remove(id);
      show("Donation deleted", "success");
      load();
    } catch (err) {
      show(apiErrorMessage(err), "error");
    }
  };

  const handleCancel = async (id: number) => {
    if (!window.confirm("Cancel this donation?")) return;
    try {
      await DonorAPI.cancel(id);
      show("Donation cancelled", "success");
      load();
    } catch (err) {
      show(apiErrorMessage(err), "error");
    }
  };

  const openEdit = (d: Donation) => {
    setEditing(d);
    setEditForm({ food_name: d.food_name, quantity: String(d.quantity), description: d.description ?? "" });
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      const formData = new FormData();
      formData.append("food_name", editForm.food_name);
      formData.append("quantity", editForm.quantity);
      formData.append("description", editForm.description);
      await DonorAPI.update(editing.id, formData);
      show("Donation updated", "success");
      setEditing(null);
      load();
    } catch (err) {
      show(apiErrorMessage(err), "error");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Donor</p>
        <h1 className="text-2xl font-display font-semibold text-ink dark:text-brand-50">Donation history</h1>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((f) => (
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
        <EmptyState icon={History} title="No donations here yet" description="Donations matching this filter will show up here." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {donations.map((d) => (
            <DonationCard
              key={d.id}
              donation={d}
              actions={
                d.status === "pending" ? (
                  <>
                    <button onClick={() => openEdit(d)} className="btn-ghost text-xs flex-1"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                    <button onClick={() => handleDelete(d.id)} className="btn-danger text-xs flex-1"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                  </>
                ) : ["accepted", "assigned"].includes(d.status) ? (
                  <button onClick={() => handleCancel(d.id)} className="btn-danger text-xs flex-1"><XCircle className="h-3.5 w-3.5" /> Cancel</button>
                ) : null
              }
            />
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit donation">
        <form onSubmit={handleEditSave} className="space-y-3">
          <div>
            <label className="label" htmlFor="edit-name">Food name</label>
            <input id="edit-name" className="input" value={editForm.food_name} onChange={(e) => setEditForm((f) => ({ ...f, food_name: e.target.value }))} />
          </div>
          <div>
            <label className="label" htmlFor="edit-qty">Quantity</label>
            <input id="edit-qty" type="number" className="input" value={editForm.quantity} onChange={(e) => setEditForm((f) => ({ ...f, quantity: e.target.value }))} />
          </div>
          <div>
            <label className="label" htmlFor="edit-desc">Description</label>
            <textarea id="edit-desc" className="input" rows={3} value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <button type="submit" className="btn-primary w-full">Save changes</button>
        </form>
      </Modal>
    </div>
  );
}
