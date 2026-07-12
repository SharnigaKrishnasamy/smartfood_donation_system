import { Leaf } from "lucide-react";

export function LoadingScreen({ label = "Loading Harvest Link…" }: { label?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-canvas dark:bg-canvasDark">
      <div className="relative flex items-center justify-center">
        <span className="absolute inline-flex h-14 w-14 rounded-full bg-brand-400/50 animate-pulse-ring" />
        <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-glass">
          <Leaf className="h-7 w-7" />
        </span>
      </div>
      <p className="text-sm font-medium text-brand-700 dark:text-brand-300">{label}</p>
    </div>
  );
}

export function InlineSpinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin ${className}`}
      aria-hidden="true"
    />
  );
}
