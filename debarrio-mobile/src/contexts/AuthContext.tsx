
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase/client';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  initializationError: string | null;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let mounted = true;
    let receivedAuthEvent = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      receivedAuthEvent = true;

      if (!mounted) {
        return;
      }

      setSession(nextSession);
      setInitializationError(null);
      setLoading(false);
    });

    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!mounted || receivedAuthEvent) {
          return;
        }

        if (error) {
          console.error('Error al recuperar la sesión:', error);
          setInitializationError(
            'No se pudo recuperar la sesión. Inténtalo de nuevo.',
          );
        } else {
          setSession(data.session);
          setInitializationError(null);
        }

        setLoading(false);
      })
      .catch((error: unknown) => {
        if (!mounted || receivedAuthEvent) {
          return;
        }

        console.error('Error al inicializar la autenticación:', error);

        setInitializationError(
          'No se pudo inicializar la autenticación. Inténtalo de nuevo.',
        );
        setLoading(false);
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      initializationError,
      signOut,
    }),
    [session, loading, initializationError, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth debe utilizarse dentro de un AuthProvider.');
  }

  return context;
}
