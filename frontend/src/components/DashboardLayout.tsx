import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Leaf, LayoutDashboard, PackagePlus, History, MapPinned, Truck,
  Users, ShieldCheck, BarChart3, Menu, X, LogOut, Moon, Sun, User as UserIcon, Search,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { NotificationBell } from "./NotificationBell";
import { Role } from "../types";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  donor: [
    { to: "/donor", label: "Dashboard", icon: LayoutDashboard },
    { to: "/donor/new", label: "New Donation", icon: PackagePlus },
    { to: "/donor/history", label: "History", icon: History },
  ],
  ngo: [
    { to: "/ngo", label: "Dashboard", icon: LayoutDashboard },
    { to: "/ngo/nearby", label: "Nearby Donations", icon: MapPinned },
    { to: "/ngo/history", label: "History", icon: History },
  ],
  volunteer: [
    { to: "/volunteer", label: "Dashboard", icon: LayoutDashboard },
    { to: "/volunteer/pickups", label: "Available Pickups", icon: Truck },
    { to: "/volunteer/history", label: "History", icon: History },
  ],
  admin: [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/users", label: "Manage Users", icon: Users },
    { to: "/admin/donations", label: "Manage Donations", icon: PackagePlus },
    { to: "/admin/ngo-approvals", label: "NGO Approvals", icon: ShieldCheck },
    { to: "/admin/reports", label: "Reports", icon: BarChart3 },
  ],
};

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;
  const navItems = NAV_BY_ROLE[user.role_name];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
          <Leaf className="h-5 w-5" />
        </span>
        <div>
          <p className="font-display font-semibold text-ink dark:text-brand-50 leading-none">Harvest Link</p>
          <p className="text-[11px] text-brand-500 dark:text-brand-400 mt-0.5 capitalize">{user.role_name} portal</p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === `/${user.role_name}`}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900"
              }`
            }
          >
            <item.icon className="h-4.5 w-4.5" />
            {item.label}
          </NavLink>
        ))}
        <NavLink
          to="/search"
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-brand-600 text-white shadow-sm"
                : "text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900"
            }`
          }
        >
          <Search className="h-4.5 w-4.5" />
          Search
        </NavLink>
      </nav>

      <div className="px-3 pb-5 space-y-1 border-t border-brand-100 dark:border-brand-900 pt-3 mx-3">
        <NavLink
          to="/profile"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900"
        >
          <UserIcon className="h-4.5 w-4.5" />
          Profile
        </NavLink>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50"
        >
          <LogOut className="h-4.5 w-4.5" />
          Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-brand-100 dark:border-brand-900 bg-white/70 dark:bg-brand-950/40 backdrop-blur-xl">
        {SidebarContent}
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-canvas dark:bg-canvasDark shadow-glass animate-fade-up">
            {SidebarContent}
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-brand-100 dark:border-brand-900 bg-canvas/80 dark:bg-canvasDark/80 backdrop-blur-xl px-4 lg:px-8 py-3">
          <button
            className="lg:hidden flex h-10 w-10 items-center justify-center rounded-full hover:bg-brand-100 dark:hover:bg-brand-900"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div className="flex-1" />

          <button
            onClick={toggle}
            aria-label="Toggle dark mode"
            className="flex h-10 w-10 items-center justify-center rounded-full text-brand-700 dark:text-brand-200 hover:bg-brand-100 dark:hover:bg-brand-900 transition-colors"
          >
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <NotificationBell />

          <div className="flex items-center gap-2 pl-2 border-l border-brand-100 dark:border-brand-900">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-ink dark:text-brand-50 leading-tight">{user.name}</p>
              <p className="text-[11px] text-brand-500 dark:text-brand-400 capitalize">{user.role_name}</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-200 font-semibold text-sm">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
