
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase/client';

export type UserProfile = {
  id: string;
  name: string;
  surname: string | null;
  role: 'user' | 'business';
  location_city: string | null;
};

export type OwnedBusiness = {
  id: number;
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  latitude: number | null;
  longitude: number | null;
};

export const ownedBusinessColumns =
  'id, name, description, address, city, postal_code, phone, email, website, latitude, longitude';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  profile: UserProfile | null;
  business: OwnedBusiness | null;
  profileLoading: boolean;
  profileError: string | null;
  initializationError: string | null;
  updateOwnedBusiness: (business: OwnedBusiness) => void;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [business, setBusiness] = useState<OwnedBusiness | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [initializationError, setInitializationError] = useState<string | null>(
    null,
  );
  const currentUserId = useRef<string | null>(null);

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
      const nextUserId = nextSession?.user.id ?? null;

      if (currentUserId.current !== nextUserId) {
        currentUserId.current = nextUserId;
        setProfile(null);
        setBusiness(null);
        setProfileLoading(Boolean(nextSession));
        setProfileError(null);
      }

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
          setProfileLoading(false);
        } else {
          setSession(data.session);
          const nextUserId = data.session?.user.id ?? null;
          currentUserId.current = nextUserId;
          setProfile(null);
          setBusiness(null);
          setProfileLoading(Boolean(data.session));
          setProfileError(null);
          setInitializationError(null);
        }

        setLoading(false);
      })
      .catch((error: unknown) => {
        if (!mounted || receivedAuthEvent) {
          return;
        }

        console.error('Error al inicializar la autenticación:', error);

        setProfileLoading(false);
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

  useEffect(() => {
    const userId = session?.user.id;

    if (!userId) {
      return;
    }

    let active = true;

    async function loadProfile() {
      try {
        const profileResult = await supabase
          .from('users')
          .select('id, name, surname, role, location_city')
          .eq('id', userId)
          .maybeSingle();

        if (profileResult.error) {
          throw profileResult.error;
        }

        if (!profileResult.data) {
          throw new Error('No existe un perfil para este usuario.');
        }

        if (
          profileResult.data.role !== 'user' &&
          profileResult.data.role !== 'business'
        ) {
          throw new Error('El perfil tiene un rol no válido.');
        }

        const loadedProfile: UserProfile = {
          id: profileResult.data.id,
          name: profileResult.data.name,
          surname: profileResult.data.surname,
          role: profileResult.data.role,
          location_city: profileResult.data.location_city,
        };
        let ownedBusiness: OwnedBusiness | null = null;

        if (loadedProfile.role === 'business') {
          const businessResult = await supabase
            .from('businesses')
            .select(ownedBusinessColumns)
            .eq('owner_id', userId)
            .order('id', { ascending: true })
            .limit(1)
            .maybeSingle();

          if (businessResult.error) {
            throw businessResult.error;
          }

          ownedBusiness = businessResult.data;
        }

        if (active) {
          setProfile(loadedProfile);
          setBusiness(ownedBusiness);
        }
      } catch (error) {
        console.error('Error al cargar el perfil del usuario:', error);

        if (active) {
          setProfile(null);
          setBusiness(null);
          setProfileError(
            'No se pudo cargar tu perfil. Comprueba tu conexión e inténtalo de nuevo.',
          );
        }
      } finally {
        if (active) {
          setProfileLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, [session?.user.id]);

  const updateOwnedBusiness = useCallback((updatedBusiness: OwnedBusiness) => {
    setBusiness((current) =>
      current?.id === updatedBusiness.id ? updatedBusiness : current,
    );
  }, []);

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }
    },
    [],
  );

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
      profile,
      business,
      profileLoading,
      profileError,
      initializationError,
      updateOwnedBusiness,
      signInWithPassword,
      signOut,
    }),
    [
      session,
      loading,
      profile,
      business,
      profileLoading,
      profileError,
      initializationError,
      updateOwnedBusiness,
      signInWithPassword,
      signOut,
    ],
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
