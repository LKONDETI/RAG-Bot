import { createContext, useContext, useState, ReactNode } from "react";

interface AuthUser {
  token: string;
  username: string;
  userId: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  guestId: string;
  login: (token: string, username: string, userId: string) => void;
  logout: () => void;
  getAuthHeaders: () => Record<string, string>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const AUTH_STORAGE_KEY = "ragbot_auth";
const GUEST_ID_KEY = "ragbot_guest_id";

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function loadOrCreateGuestId(): string {
  let id = localStorage.getItem(GUEST_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(GUEST_ID_KEY, id);
  }
  return id;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => loadUser());
  const guestId = loadOrCreateGuestId();

  const login = (token: string, username: string, userId: string) => {
    const authUser = { token, username, userId };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
    setUser(authUser);
  };

  const logout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
  };

  const getAuthHeaders = (): Record<string, string> => {
    if (user) return { Authorization: `Bearer ${user.token}` };
    return { "X-Guest-ID": guestId };
  };

  return (
    <AuthContext.Provider value={{ user, guestId, login, logout, getAuthHeaders }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
