import { Link } from "react-router-dom";
import { Leaf, Users, MapPinned, BellRing, ArrowRight } from "lucide-react";

const FEATURES = [
  { icon: Users, title: "Four roles, one flow", desc: "Donors, NGOs, volunteers, and admins each get a dashboard built for their part of the journey." },
  { icon: MapPinned, title: "Live location matching", desc: "Leaflet-powered maps surface the nearest donations, pickups, and deliveries." },
  { icon: BellRing, title: "Real-time updates", desc: "Socket.IO pushes every status change instantly — no refreshing, no missed handoffs." },
];

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between px-6 lg:px-10 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Leaf className="h-5 w-5" />
          </span>
          <span className="font-display font-semibold text-ink dark:text-brand-50">Share Bite</span>
        </div>
        <div className="flex gap-2">
          <Link to="/login" className="btn-ghost">Sign in</Link>
          <Link to="/register" className="btn-primary">Get started</Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 lg:px-10 pt-16 pb-24 text-center">
        <p className="eyebrow justify-center flex mb-4">REDUCE WASTE • FEED LIVES</p>
        <h1 className="text-4xl sm:text-5xl font-display font-semibold text-ink dark:text-brand-50 max-w-2xl mx-auto leading-tight">
          Surplus food, straight to the people who need it.
        </h1>
        <p className="mt-5 text-brand-600 dark:text-brand-300 max-w-xl mx-auto">
           Connects donors, NGOs and volunteers on one platform so nothing edible goes to waste
          and every handoff is visible from pickup to delivery.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/register" className="btn-primary">
            Create an account <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/login" className="btn-secondary">Sign in</Link>
        </div>

        <div className="grid sm:grid-cols-3 gap-5 mt-20 text-left">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 mb-3">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="font-display font-semibold text-ink dark:text-brand-50">{f.title}</h3>
              <p className="text-sm text-brand-600/90 dark:text-brand-300/80 mt-1.5">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
