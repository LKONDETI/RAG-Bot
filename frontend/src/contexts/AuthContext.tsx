import { createContext, useContext, useState, ReactNode } from "react";

interface AuthUser {
  token: string;
  username: string;
  userId: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (token: string, username: string, userId: string) => void;
  logout: () => void;
  getAuthHeaders: () => Record<string, string>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "ragbot_auth";

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => loadUser());

  const login = (token: string, username: string, userId: string) => {
    const authUser = { token, username, userId };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
    setUser(authUser);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  const getAuthHeaders = (): Record<string, string> => {
    if (!user) return {};
    return { Authorization: `Bearer ${user.token}` };
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, getAuthHeaders }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
