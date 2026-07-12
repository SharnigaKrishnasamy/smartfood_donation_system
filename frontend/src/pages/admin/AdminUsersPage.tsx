import { useEffect, useState } from "react";
import { Search, Ban, Trash2, CheckCircle2 } from "lucide-react";
import { AdminAPI } from "../../services/endpoints";
import { User, Role } from "../../types";
import { EmptyState } from "../../components/EmptyState";
import { LoadingScreen } from "../../components/LoadingScreen";
import { useToast } from "../../context/ToastContext";
import { apiErrorMessage } from "../../services/api";

const ROLES: (Role | "")[] = ["", "donor", "ngo", "volunteer", "admin"];

export function AdminUsersPage() {
  const { show } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role | "">("");
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    AdminAPI.listUsers({ role: role || undefined, search: search || undefined })
      .then((resp) => setUsers(resp.data.users))
      .catch((err) => show(apiErrorMessage(err), "error"))
      .finally(() => setLoading(false));
  };

  useEffect(load, [role]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleActive = async (id: number) => {
    try {
      await AdminAPI.toggleActive(id);
      load();
    } catch (err) {
      show(apiErrorMessage(err), "error");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Permanently delete this user? This cannot be undone.")) return;
    try {
      await AdminAPI.deleteUser(id);
      show("User deleted", "success");
      load();
    } catch (err) {
      show(apiErrorMessage(err), "error");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Admin</p>
        <h1 className="text-2xl font-display font-semibold text-ink dark:text-brand-50">Manage users</h1>
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-400" />
          <input
            className="input pl-9"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
          />
        </div>
        <select className="input w-auto" value={role} onChange={(e) => setRole(e.target.value as Role | "")}>
          {ROLES.map((r) => <option key={r} value={r}>{r ? r.charAt(0).toUpperCase() + r.slice(1) : "All roles"}</option>)}
        </select>
        <button onClick={load} className="btn-secondary">Search</button>
      </div>

      {loading ? (
        <LoadingScreen label="Loading users…" />
      ) : users.length === 0 ? (
        <EmptyState title="No users found" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-brand-500 border-b border-brand-100 dark:border-brand-900">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-brand-50 dark:border-brand-900/60 last:border-0">
                  <td className="px-4 py-3 font-medium text-ink dark:text-brand-50">
                    {u.organization_name || u.name}
                  </td>
                  <td className="px-4 py-3 text-brand-600 dark:text-brand-300">{u.email}</td>
                  <td className="px-4 py-3 capitalize">{u.role_name}</td>
                  <td className="px-4 py-3">
                    {u.is_active ? (
                      <span className="badge bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300">Active</span>
                    ) : (
                      <span className="badge bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">Deactivated</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <button
                      onClick={() => handleToggleActive(u.id)}
                      className="btn-ghost text-xs px-2 py-1"
                      title={u.is_active ? "Deactivate" : "Reactivate"}
                    >
                      {u.is_active ? <Ban className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    </button>
                    <button onClick={() => handleDelete(u.id)} className="btn-ghost text-xs px-2 py-1 text-red-500" title="Delete">
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
