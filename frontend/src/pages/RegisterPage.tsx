import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Leaf, HeartHandshake, Building2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { apiErrorMessage } from "../services/api";
import { InlineSpinner } from "../components/LoadingScreen";
import { MapPicker } from "../components/MapPicker";
import { Role } from "../types";

const ROLE_OPTIONS: { value: Role; label: string; icon: typeof Leaf; desc: string }[] = [
  { value: "donor", label: "Donor", icon: Leaf, desc: "Restaurants, events, households with surplus food" },
  { value: "ngo", label: "NGO", icon: Building2, desc: "Organizations distributing food to people in need" },
  { value: "volunteer", label: "Volunteer", icon: HeartHandshake, desc: "Help pick up and deliver donations" },
];

export function RegisterPage() {
  const { register } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();

  const [role, setRole] = useState<Role>("donor");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [orgName, setOrgName] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const message = await register({
        name, email, password, phone, role,
        organization_name: orgName || undefined,
        registration_number: regNumber || undefined,
        address: address || undefined,
        latitude: lat,
        longitude: lng,
      });
      if (message) {
        show(message, "success");
        navigate("/login");
      } else {
        show("Account created! Welcome to Harvest Link.", "success");
        navigate("/redirecting");
      }
    } catch (err) {
      show(apiErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg animate-fade-up">
        <div className="flex flex-col items-center mb-6">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-glass mb-3">
            <Leaf className="h-7 w-7" />
          </span>
          <h1 className="text-2xl font-display font-semibold text-ink dark:text-brand-50">Join Share Bite</h1>
        </div>

        <form onSubmit={handleSubmit} className="glass-panel rounded-xl2 p-6 sm:p-8 space-y-4">
          <div>
            <span className="label">I am a…</span>
            <div className="grid grid-cols-3 gap-2">
              {ROLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRole(opt.value)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-colors ${
                    role === opt.value
                      ? "border-brand-600 bg-brand-50 dark:bg-brand-900/60"
                      : "border-brand-200 dark:border-brand-800 hover:bg-brand-50 dark:hover:bg-brand-900/40"
                  }`}
                >
                  <opt.icon className={`h-5 w-5 ${role === opt.value ? "text-brand-700 dark:text-brand-200" : "text-brand-400"}`} />
                  <span className="text-xs font-semibold text-ink dark:text-brand-50">{opt.label}</span>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-brand-500 mt-1.5">
              {ROLE_OPTIONS.find((o) => o.value === role)?.desc}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="label" htmlFor="name">Full name</label>
              <input id="name" required className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="label" htmlFor="phone">Phone</label>
              <input id="phone" required className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label" htmlFor="reg-email">Email</label>
              <input id="reg-email" type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label" htmlFor="reg-password">Password</label>
              <input id="reg-password" type="password" required minLength={6} className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>

          {role === "ngo" && (
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-brand-50 dark:bg-brand-950/50 p-3 border border-brand-200 dark:border-brand-800">
              <div className="col-span-2">
                <label className="label" htmlFor="org-name">Organization name</label>
                <input id="org-name" required className="input" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="label" htmlFor="reg-number">Registration number (optional)</label>
                <input id="reg-number" className="input" value={regNumber} onChange={(e) => setRegNumber(e.target.value)} />
              </div>
              <p className="col-span-2 text-[11px] text-brand-500">
                NGO accounts require admin approval before you can log in and accept donations.
              </p>
            </div>
          )}

          <div>
            <label className="label" htmlFor="address">Address</label>
            <input id="address" className="input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, area, city" />
          </div>

          <div>
            <span className="label">Location (tap the map or use your location)</span>
            <MapPicker latitude={lat} longitude={lng} onChange={(a, b) => { setLat(a); setLng(b); }} height="220px" />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading && <InlineSpinner />}
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-brand-600 dark:text-brand-300 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-brand-700 dark:text-brand-200 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
