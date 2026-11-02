'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { api, setUnauthorizedHandler } from '../lib/Api';
import { fetcher } from '../lib/Swr';
import type { AuthResponse, Organization, RegisterInput, User } from '../types/Auth';

// ---------------------------------------------------------------
// Session de l'utilisateur, gérée par SWR.
// Le token est dans un cookie httpOnly : le JavaScript ne peut pas le lire.
// La session est donc la réponse de GET /api/auth/me, mise en cache par SWR
// sous la clé ME_KEY.
// ---------------------------------------------------------------

export const ME_KEY = '/auth/me';

const ANONYMOUS: AuthResponse = { user: null, organization: null };

type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

interface AuthContextValue {
  user: User | null;
  organization: Organization | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { mutate: mutateCache } = useSWRConfig();

  const { data, isLoading, mutate } = useSWR<AuthResponse>(ME_KEY, fetcher, {
    // En revenant sur l'onglet, on revérifie la session (cookie expiré ?)
    revalidateOnFocus: true,
    shouldRetryOnError: false,
  });

  // Remplace la session. Toutes les autres données en cache sont vidées :
  // un nouvel utilisateur ne doit jamais voir les données du précédent.
  const setSession = useCallback(
    async (session: AuthResponse) => {
      await mutateCache((key) => key !== ME_KEY, undefined, { revalidate: false });
      await mutate(session, { revalidate: false });
    },
    [mutateCache, mutate]
  );

  // Une route protégée a répondu 401 : la session a expiré
  useEffect(() => {
    setUnauthorizedHandler(() => {
      void setSession(ANONYMOUS);
    });
    return () => setUnauthorizedHandler(null);
  }, [setSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data: session } = await api.post<AuthResponse>('/auth/login', { email, password });
      if (!session.user) throw new Error('Réponse de connexion invalide');
      await setSession(session);
      return session.user;
    },
    [setSession]
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const { data: session } = await api.post<AuthResponse>('/auth/register-organization', input);
      if (!session.user) throw new Error("Réponse d'inscription invalide");
      await setSession(session);
      return session.user;
    },
    [setSession]
  );

  // Le cookie httpOnly ne peut être supprimé que par le backend
  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      await setSession(ANONYMOUS);
    }
  }, [setSession]);

  // Relit la session (ex : après une modification du profil)
  const refresh = useCallback(async () => {
    await mutate();
  }, [mutate]);

  const user = data?.user ?? null;
  const organization = data?.organization ?? null;
  // Backend injoignable : data reste vide, on considère l'utilisateur déconnecté
  const status: AuthStatus = isLoading && !data ? 'loading' : user ? 'authenticated' : 'anonymous';

  const value = useMemo(
    () => ({ user, organization, status, login, register, logout, refresh }),
    [user, organization, status, login, register, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé à l’intérieur de <AuthProvider>');
  return ctx;
}