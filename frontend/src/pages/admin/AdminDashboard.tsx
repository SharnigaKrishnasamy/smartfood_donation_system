import { useEffect, useState } from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell,
} from "recharts";
import { Users, Package, CheckCircle2, Leaf, ShieldAlert } from "lucide-react";
import { AdminAPI } from "../../services/endpoints";
import { StatCard } from "../../components/StatCard";
import { LoadingScreen } from "../../components/LoadingScreen";
import { useToast } from "../../context/ToastContext";
import { apiErrorMessage } from "../../services/api";
import { Link } from "react-router-dom";

const PIE_COLORS = ["#3a9958", "#5fb478", "#94d1a5", "#f59e0b", "#0ea5e9", "#a855f7", "#ef4444", "#94a3b8"];

interface DashboardData {
  users: { total: number; donors: number; ngos: number; volunteers: number; pending_ngo_approvals: number };
  donations: { total: number; delivered: number; pending: number; active: number; status_breakdown: Record<string, number> };
  impact: { food_saved_total: number; unit_breakdown: Record<string, number>; people_served_estimate: number };
  trend_last_30_days: { date: string; count: number }[];
}

export function AdminDashboard() {
  const { show } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AdminAPI.dashboard()
      .then((resp: any) => setData(resp.data))
      .catch((err) => show(apiErrorMessage(err), "error"))
      .finally(() => setLoading(false));
  }, [show]);

  if (loading || !data) return <LoadingScreen label="Loading platform analytics…" />;

  const statusData = Object.entries(data.donations.status_breakdown).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Admin</p>
        <h1 className="text-2xl font-display font-semibold text-ink dark:text-brand-50">Platform overview</h1>
      </div>

      {data.users.pending_ngo_approvals > 0 && (
        <Link
          to="/admin/ngo-approvals"
          className="flex items-center gap-3 rounded-xl2 border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 p-4 text-amber-800 dark:text-amber-300 hover:shadow-card transition-shadow"
        >
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium">
            {data.users.pending_ngo_approvals} NGO account{data.users.pending_ngo_approvals > 1 ? "s" : ""} awaiting approval — review now
          </span>
        </Link>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={data.users.total} />
        <StatCard icon={Package} label="Total Donations" value={data.donations.total} accent="sky" />
        <StatCard icon={CheckCircle2} label="Delivered" value={data.donations.delivered} accent="brand" />
        <StatCard icon={Leaf} label="Est. People Served" value={data.impact.people_served_estimate} accent="purple" hint="rough estimate" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Donors" value={data.users.donors} />
        <StatCard icon={Users} label="Approved NGOs" value={data.users.ngos} />
        <StatCard icon={Users} label="Volunteers" value={data.users.volunteers} />
        <StatCard icon={Package} label="Pending Donations" value={data.donations.pending} accent="amber" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="font-display font-semibold text-ink dark:text-brand-50 mb-4">Donations — last 30 days</h2>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.trend_last_30_days}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3a9958" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3a9958" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0f3e5" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#3a9958" fill="url(#colorCount)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="font-display font-semibold text-ink dark:text-brand-50 mb-4">Status breakdown</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(entry) => entry.name}>
                {statusData.map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
