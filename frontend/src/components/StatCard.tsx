import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  accent?: "brand" | "amber" | "sky" | "purple";
}

const accentStyles: Record<string, string> = {
  brand: "bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  sky: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  purple: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
};

export function StatCard({ icon: Icon, label, value, hint, accent = "brand" }: StatCardProps) {
  return (
    <div className="card p-5 flex items-start justify-between gap-3 animate-fade-up">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-500 dark:text-brand-400">
          {label}
        </p>
        <p className="mt-1.5 text-2xl font-display font-semibold text-ink dark:text-brand-50">{value}</p>
        {hint && <p className="mt-1 text-xs text-brand-500/80 dark:text-brand-400/70">{hint}</p>}
      </div>
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accentStyles[accent]}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}
