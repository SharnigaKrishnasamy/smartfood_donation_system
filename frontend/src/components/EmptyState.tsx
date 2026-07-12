import { LucideIcon, Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-xl2 border border-dashed border-brand-200 dark:border-brand-800 bg-brand-50/40 dark:bg-brand-950/30 animate-fade-up">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900 text-brand-600 dark:text-brand-300">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold font-display text-ink dark:text-brand-50">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-brand-600/80 dark:text-brand-300/80">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
