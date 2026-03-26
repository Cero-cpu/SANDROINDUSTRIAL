import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";

// ---- Types ----
interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  setToken: (token: string) => void;
  logout: () => void;
}

// ---- Demo mode detection ----
// In production without a VITE_API_URL we run in demo mode (Vercel static deploy)
const DEMO_MODE = import.meta.env.PROD && !import.meta.env.VITE_API_URL;

const DEMO_USER: User = {
  id: 1,
  email: "admin@sandroindustrial.com",
  name: "Administrador",
  role: "admin",
};

// ---- Fetch interceptor (only in non-demo mode) ----
if (!DEMO_MODE && typeof window !== "undefined") {
  const originalFetch = window.fetch;
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    const token = localStorage.getItem("si_token");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    const newInit = { ...init, headers };
    const response = await originalFetch(input, newInit);

    // Auto-logout on 401
    if (response.status === 401 && !input.toString().includes("/auth/login")) {
      localStorage.removeItem("si_token");
      window.location.href = "/login";
    }
    return response;
  };
}

// ---- Context ----
const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(localStorage.getItem("si_token"));
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  const setToken = useCallback((newToken: string) => {
    localStorage.setItem("si_token", newToken);
    setTokenState(newToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("si_token");
    setTokenState(null);
    setUser(null);
    setLocation("/login");
  }, [setLocation]);

  // Effect to fetch or set user based on token
  useEffect(() => {
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    if (DEMO_MODE) {
      // In demo mode, any token is valid — just set the demo user
      setUser(DEMO_USER);
      setIsLoading(false);
      return;
    }

    // Real mode: fetch /api/auth/me
    let cancelled = false;
    setIsLoading(true);

    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setUser(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          // Token invalid — clear and redirect
          localStorage.removeItem("si_token");
          setTokenState(null);
          setUser(null);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, isLoading, setToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
