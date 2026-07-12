import { useState, useRef, useEffect } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useNotifications } from "../context/NotificationContext";
import { Link } from "react-router-dom";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-brand-700 dark:text-brand-200 hover:bg-brand-100 dark:hover:bg-brand-900 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 glass-panel rounded-xl2 p-2 z-50 animate-fade-up">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-sm font-semibold text-ink dark:text-brand-50">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead()}
                className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-800 dark:text-brand-300"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-brand-500">You're all caught up.</p>
            ) : (
              notifications.slice(0, 15).map((n) => (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-brand-50 dark:hover:bg-brand-900/60 ${
                    n.is_read ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-ink dark:text-brand-50">{n.title}</span>
                    {!n.is_read && <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-500 shrink-0" />}
                  </div>
                  <p className="text-brand-600/80 dark:text-brand-300/70 mt-0.5">{n.message}</p>
                  <p className="text-[11px] text-brand-400 mt-1">{timeAgo(n.created_at)}</p>
                </button>
              ))
            )}
          </div>
          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="block text-center text-xs font-semibold text-brand-600 hover:text-brand-800 dark:text-brand-300 py-2"
          >
            View all
          </Link>
        </div>
      )}
    </div>
  );
}
