import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User } from "../types";
import { AuthAPI } from "../services/endpoints";
import { setTokens, clearTokens, getAccessToken, apiErrorMessage } from "../services/api";
import { connectSocket, disconnectSocket } from "../services/socket";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: Record<string, unknown>) => Promise<string | null>; // returns message if pending approval
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const bootstrap = useCallback(async () => {
    if (!getAccessToken()) {
      setLoading(false);
      return;
    }
    try {
      const resp = await AuthAPI.me();
      setUser(resp.data.user);
      connectSocket();
    } catch {
      clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = async (email: string, password: string) => {
    const resp = await AuthAPI.login(email, password);
    setTokens(resp.data.access_token, resp.data.refresh_token);
    setUser(resp.data.user);
    connectSocket();
  };

  const register = async (payload: Record<string, unknown>): Promise<string | null> => {
    const resp = await AuthAPI.register(payload);
    if (resp.data.access_token) {
      setTokens(resp.data.access_token, resp.data.refresh_token);
      setUser(resp.data.user);
      connectSocket();
      return null;
    }
    // NGO path: pending approval, no tokens issued
    return resp.data.message as string;
  };

  const logout = () => {
    AuthAPI.logout().catch(() => {});
    clearTokens();
    disconnectSocket();
    setUser(null);
  };

  const refreshUser = async () => {
    const resp = await AuthAPI.me();
    setUser(resp.data.user);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { apiErrorMessage };
