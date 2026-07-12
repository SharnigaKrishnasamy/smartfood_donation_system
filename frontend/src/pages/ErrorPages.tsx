import { Link } from "react-router-dom";
import { Leaf, ShieldAlert } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 dark:bg-brand-900 text-brand-600 dark:text-brand-300">
        <Leaf className="h-7 w-7" />
      </span>
      <h1 className="text-3xl font-display font-semibold text-ink dark:text-brand-50">Page not found</h1>
      <p className="text-brand-600 dark:text-brand-300 max-w-sm">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <Link to="/" className="btn-primary mt-2">Back to home</Link>
    </div>
  );
}

export function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-300">
        <ShieldAlert className="h-7 w-7" />
      </span>
      <h1 className="text-3xl font-display font-semibold text-ink dark:text-brand-50">Access restricted</h1>
      <p className="text-brand-600 dark:text-brand-300 max-w-sm">
        Your account role doesn't have permission to view this page.
      </p>
      <Link to="/redirecting" className="btn-primary mt-2">Go to my dashboard</Link>
    </div>
  );
}
