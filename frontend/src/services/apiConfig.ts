/**
 * Resolves the backend base URL.
 *
 * Priority:
 * 1. A manually-set override in localStorage (set via the "API Server" field
 *    on the login screen) — lets someone type the host laptop's IP directly
 *    on a phone that doesn't share a hostname assumption with the laptop.
 * 2. VITE_API_BASE_URL from .env, if provided at build time.
 * 3. Auto-detected: same hostname the frontend was loaded from, port 5000.
 *    This is what makes "just open http://<laptop-ip>:5173 on your phone"
 *    work with zero configuration — the phone's browser already knows the
 *    laptop's LAN IP because that's the URL it typed in.
 */

const STORAGE_KEY = "food_donation_api_base_url";

export function getApiBaseUrl(): string {
  const override = localStorage.getItem(STORAGE_KEY);
  if (override) return override;

  const envUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (envUrl) return envUrl;

  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:5000`;
}

export function setApiBaseUrl(url: string) {
  localStorage.setItem(STORAGE_KEY, url.replace(/\/+$/, ""));
}

export function clearApiBaseUrlOverride() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getStoredApiBaseUrlOverride(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}
