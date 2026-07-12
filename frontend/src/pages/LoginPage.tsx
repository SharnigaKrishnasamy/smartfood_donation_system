import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Leaf, Eye, EyeOff, Settings2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { apiErrorMessage } from "../services/api";
import { InlineSpinner } from "../components/LoadingScreen";
import { ApiServerField } from "../components/ApiServerField";

export function LoginPage() {
  const { login } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      show("Welcome back!", "success");
      navigate("/redirecting");
    } catch (err) {
      show(apiErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md animate-fade-up">
        <div className="flex flex-col items-center mb-8">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-glass mb-3">
            <Leaf className="h-7 w-7" />
          </span>
          <h1 className="text-2xl font-display font-semibold text-ink dark:text-brand-50">Share Bite</h1>
          <p className="text-sm text-brand-600 dark:text-brand-300 mt-1">
            Surplus food, straight to the people who need it.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass-panel rounded-xl2 p-6 sm:p-8 space-y-4">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Name/SomethingAboutYou@example.com"
            />
          </div>

          <div>
            <label className="label" htmlFor="password">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                className="input pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-400 hover:text-brand-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading && <InlineSpinner />}
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <button
            type="button"
            onClick={() => setShowServerConfig((s) => !s)}
            className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-brand-500 hover:text-brand-700 dark:hover:text-brand-300 pt-1"
          >
            <Settings2 className="h-3.5 w-3.5" />
            Connecting from another device? Set server address
          </button>

          {showServerConfig && <ApiServerField />}
        </form>

        <p className="text-center text-sm text-brand-600 dark:text-brand-300 mt-6">
          New here?{" "}
          <Link to="/register" className="font-semibold text-brand-700 dark:text-brand-200 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
