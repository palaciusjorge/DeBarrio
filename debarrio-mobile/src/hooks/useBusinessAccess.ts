import { useEffect } from 'react';
import { router } from 'expo-router';

import { useAuth } from '@/contexts/AuthContext';

export function useBusinessAccess() {
  const { user, loading, profile, business, profileLoading, profileError } =
    useAuth();
  const ownedBusiness =
    user && profile?.id === user.id && profile.role === 'business'
      ? business
      : null;

  useEffect(() => {
    if (loading || profileLoading || profileError) {
      return;
    }

    if (!user) {
      router.replace('/login');
    } else if (!ownedBusiness) {
      router.replace('/(tabs)/settings');
    }
  }, [loading, profileLoading, profileError, user, ownedBusiness]);

  return {
    business: ownedBusiness,
    error: profileError,
    loading: loading || profileLoading,
  };
}
