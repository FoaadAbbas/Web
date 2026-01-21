import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type AuthUser = {
  id: string;
  email: string;
  name: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const LS_KEY_TOKEN = "constrack_token";
const LS_KEY_USER = "constrack_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const token = localStorage.getItem(LS_KEY_TOKEN);
    const userStr = localStorage.getItem(LS_KEY_USER);
    if (!token || !userStr) return;
    try {
      const u = JSON.parse(userStr);
      // TODO: validate token exp
      setUser(u);
    } catch {
      localStorage.removeItem(LS_KEY_TOKEN);
      localStorage.removeItem(LS_KEY_USER);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      login: async (email: string, password: string) => {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Login failed");
        }
        const data = await res.json();
        localStorage.setItem(LS_KEY_TOKEN, data.token);
        localStorage.setItem(LS_KEY_USER, JSON.stringify(data.user));
        setUser(data.user);
      },
      register: async (name: string, email: string, password: string) => {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Register failed");
        }
        const data = await res.json();
        localStorage.setItem(LS_KEY_TOKEN, data.token);
        localStorage.setItem(LS_KEY_USER, JSON.stringify(data.user));
        setUser(data.user);
      },
      logout: () => {
        setUser(null);
        localStorage.removeItem(LS_KEY_TOKEN);
        localStorage.removeItem(LS_KEY_USER);
      },
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
