import { createContext, useContext, useEffect, useState } from 'react';
import { api, AuthUser } from '../lib/api';

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => { },
  signOut: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/me').then(({ data }) => setUser(data)).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  const signOut = async () => {
    await api.post('/auth/logout').catch(() => undefined);
    setUser(null);
  };

  const signIn = async (email: string, password: string) => {
    await api.post('/auth/login', { email, password });
    const { data } = await api.get('/auth/me');
    setUser(data);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
