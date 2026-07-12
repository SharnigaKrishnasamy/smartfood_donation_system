import { useEffect, useState } from "react";
import { Download, FileText } from "lucide-react";
import { AdminAPI } from "../../services/endpoints";
import { InlineSpinner } from "../../components/LoadingScreen";
import { EmptyState } from "../../components/EmptyState";
import { useToast } from "../../context/ToastContext";
import { apiErrorMessage } from "../../services/api";

interface AuditLog {
  id: number;
  action: string;
  entity_type?: string | null;
  entity_id?: number | null;
  details?: string | null;
  created_at: string;
}

export function AdminReportsPage() {
  const { show } = useToast();
  const [exporting, setExporting] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  useEffect(() => {
    AdminAPI.auditLogs()
      .then((resp: any) => setLogs(resp.data.logs))
      .catch((err) => show(apiErrorMessage(err), "error"))
      .finally(() => setLoadingLogs(false));
  }, [show]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const resp = await AdminAPI.exportCsv();
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = "donations_report.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      show("Report downloaded", "success");
    } catch (err) {
      show(apiErrorMessage(err), "error");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Admin</p>
        <h1 className="text-2xl font-display font-semibold text-ink dark:text-brand-50">Reports & audit trail</h1>
      </div>

      <div className="card p-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-semibold text-ink dark:text-brand-50">Donations CSV export</h2>
          <p className="text-sm text-brand-600 dark:text-brand-300 mt-1">
            Download a full CSV of every donation with donor, NGO, status, and timestamps.
          </p>
        </div>
        <button onClick={handleExport} disabled={exporting} className="btn-primary shrink-0">
          {exporting ? <InlineSpinner /> : <Download className="h-4 w-4" />}
          Export CSV
        </button>
      </div>

      <div>
        <h2 className="font-display font-semibold text-ink dark:text-brand-50 mb-3">Recent audit log</h2>
        {loadingLogs ? (
          <p className="text-sm text-brand-500">Loading…</p>
        ) : logs.length === 0 ? (
          <EmptyState icon={FileText} title="No audit activity yet" />
        ) : (
          <div className="card divide-y divide-brand-50 dark:divide-brand-900/60 max-h-96 overflow-y-auto">
            {logs.map((log) => (
              <div key={log.id} className="px-4 py-3 flex items-center justify-between gap-3 text-sm">
                <div>
                  <span className="font-medium text-ink dark:text-brand-50">{log.action.replace(/_/g, " ")}</span>
                  {log.entity_type && (
                    <span className="text-brand-500"> · {log.entity_type} #{log.entity_id}</span>
                  )}
                  {log.details && <p className="text-xs text-brand-500 mt-0.5">{log.details}</p>}
                </div>
                <span className="text-xs text-brand-400 shrink-0">{new Date(log.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
