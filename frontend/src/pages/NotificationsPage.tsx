import { CheckCheck, BellOff } from "lucide-react";
import { useNotifications } from "../context/NotificationContext";
import { EmptyState } from "../components/EmptyState";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NotificationsPage() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">Updates</p>
          <h1 className="text-2xl font-display font-semibold text-ink dark:text-brand-50">Notifications</h1>
        </div>
        {unreadCount > 0 && (
          <button onClick={() => markAllRead()} className="btn-secondary text-xs">
            <CheckCheck className="h-3.5 w-3.5" /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={BellOff} title="No notifications yet" description="You'll see real-time updates here as donations move through the pipeline." />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => markRead(n.id)}
              className={`w-full text-left card p-4 transition-colors hover:shadow-glass ${n.is_read ? "opacity-60" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-ink dark:text-brand-50">{n.title}</span>
                {!n.is_read && <span className="mt-1.5 h-2 w-2 rounded-full bg-brand-500 shrink-0" />}
              </div>
              <p className="text-sm text-brand-600/90 dark:text-brand-300/80 mt-1">{n.message}</p>
              <p className="text-xs text-brand-400 mt-2">{timeAgo(n.created_at)}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
