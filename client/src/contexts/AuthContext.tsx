import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface User {
  id: number;
  email: string;
  created_at?: string;
  has_brand_profile?: boolean;
  tier?: string;
}

interface DailyUsage {
  count: number;
  limit: number | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  authError: string | null;
  hasBrandProfile: boolean;
  setHasBrandProfile: (v: boolean) => void;
  tier: string;
  dailyUsage: DailyUsage;
  refreshUsage: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  retryAuth: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_BASE = '/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('token')
  );
  const [loading, setLoading] = useState(true);
  const [hasBrandProfile, setHasBrandProfile] = useState(false);
  const [tier, setTier] = useState('free');
  const [dailyUsage, setDailyUsage] = useState<DailyUsage>({ count: 0, limit: 10 });

  const fetchSubscription = useCallback(async (authToken: string) => {
    try {
      const res = await fetch(`${API_BASE}/subscription`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTier(data.tier || 'free');
        setDailyUsage({
          count: data.dailyUsage?.count || 0,
          limit: data.dailyUsage?.limit,
        });
      }
    } catch {
      // ignore
    }
  }, []);

  const refreshUsage = useCallback(async () => {
    if (token) {
      await fetchSubscription(token);
    }
  }, [token, fetchSubscription]);

  const [authError, setAuthError] = useState<string | null>(null);

  const verifyToken = useCallback(async () => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      setLoading(false);
      return;
    }
    setAuthError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setHasBrandProfile(data.user.has_brand_profile || false);
        setTier(data.user.tier || 'free');
        await fetchSubscription(currentToken);
      } else {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      }
    } catch {
      setAuthError('Unable to connect to the server. Check your connection and try again.');
    }
    setLoading(false);
  }, [fetchSubscription]);

  const retryAuth = useCallback(() => {
    setLoading(true);
    setAuthError(null);
    verifyToken();
  }, [verifyToken]);

  // On mount, check if existing token is still valid
  useEffect(() => {
    if (token) {
      verifyToken();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Login failed');
    }

    const data = await res.json();
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);

    // Check brand profile status and subscription
    try {
      const profileRes = await fetch(`${API_BASE}/brand-profile`, {
        headers: { Authorization: `Bearer ${data.token}` },
      });
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setHasBrandProfile(!!profileData.profile);
      }
      await fetchSubscription(data.token);
    } catch {
      // ignore
    }
  };

  const signup = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Signup failed');
    }

    const data = await res.json();
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    // New users won't have a brand profile yet
    setHasBrandProfile(false);
    setTier('free');
    setDailyUsage({ count: 0, limit: 10 });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setHasBrandProfile(false);
    setTier('free');
    setDailyUsage({ count: 0, limit: 10 });
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, authError, hasBrandProfile, setHasBrandProfile, tier, dailyUsage, refreshUsage, login, signup, logout, retryAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
