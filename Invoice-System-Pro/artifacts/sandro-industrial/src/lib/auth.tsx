import React, { createContext, useContext, useState, useEffect } from "react";
import { User, useGetMe } from "@workspace/api-client-react";
import { useLocation } from "wouter";

// --- FETCH INTERCEPTOR FOR JWT ---
// We patch window.fetch so that ALL calls made by the generated orval hooks
// automatically get the Authorization header from localStorage.
const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  let headers = new Headers(init?.headers);
  
  const token = localStorage.getItem("si_token");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const newInit = { ...init, headers };
  const response = await originalFetch(input, newInit);

  // Auto-logout on 401
  if (response.status === 401 && !input.toString().includes('/auth/login')) {
    localStorage.removeItem("si_token");
    window.location.href = "/login";
  }

  return response;
};

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  setToken: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(localStorage.getItem("si_token"));
  const [, setLocation] = useLocation();

  const { data: user, isLoading, refetch } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
    }
  });

  const setToken = (newToken: string) => {
    localStorage.setItem("si_token", newToken);
    setTokenState(newToken);
    refetch();
  };

  const logout = () => {
    localStorage.removeItem("si_token");
    setTokenState(null);
    setLocation("/login");
  };

  useEffect(() => {
    // If we have a token but fetching the user failed, we might be unauthorized.
    // The fetch interceptor handles the 401 redirect, but we can also sync state here.
    if (token && !isLoading && !user) {
      // Actually, if it errors out it might just be network. Leave it to interceptor.
    }
  }, [token, isLoading, user]);

  return (
    <AuthContext.Provider value={{ user: user || null, isLoading, setToken, logout }}>
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
