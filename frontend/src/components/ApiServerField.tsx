import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { getApiBaseUrl, setApiBaseUrl, getStoredApiBaseUrlOverride, clearApiBaseUrlOverride } from "../services/apiConfig";
import axios from "axios";

export function ApiServerField() {
  const [value, setValue] = useState(getStoredApiBaseUrlOverride() ?? getApiBaseUrl());
  const [status, setStatus] = useState<"idle" | "ok" | "fail" | "checking">("idle");

  const test = async (url: string) => {
    setStatus("checking");
    try {
      await axios.get(`${url.replace(/\/+$/, "")}/api/health`, { timeout: 4000 });
      setStatus("ok");
    } catch {
      setStatus("fail");
    }
  };

  const save = () => {
    if (!value.trim()) {
      clearApiBaseUrlOverride();
      return;
    }
    setApiBaseUrl(value.trim());
    test(value.trim());
  };

  return (
    <div className="rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 p-3 space-y-2 animate-fade-up">
      <label className="label" htmlFor="server-url">Backend server address</label>
      <div className="flex gap-2">
        <input
          id="server-url"
          className="input text-sm"
          placeholder="http://192.168.1.42:5000"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button type="button" onClick={save} className="btn-secondary shrink-0 px-3">
          Save
        </button>
      </div>
      <p className="text-[11px] text-brand-500 dark:text-brand-400">
        Use the LAN IP shown when the backend started (e.g. http://192.168.1.42:5000). Leave blank to
        auto-detect from this page's address.
      </p>
      {status === "ok" && (
        <p className="flex items-center gap-1 text-xs font-medium text-brand-700 dark:text-brand-300">
          <CheckCircle2 className="h-3.5 w-3.5" /> Server reachable
        </p>
      )}
      {status === "fail" && (
        <p className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
          <XCircle className="h-3.5 w-3.5" /> Could not reach that address
        </p>
      )}
    </div>
  );
}
