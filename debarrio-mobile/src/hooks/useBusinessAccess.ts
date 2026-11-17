import { useEffect } from 'react';
import { router } from 'expo-router';

import { useAuth } from '@/contexts/AuthContext';

export function useBusinessAccess() {
  const { user, loading, profile, business, profileLoading, profileError } =
    useAuth();

  useEffect(() => {
    if (loading || profileLoading || profileError) {
      return;
    }

    if (!user) {
      router.replace('/login');
    } else if (profile?.role !== 'business' || !business) {
      router.replace('/(tabs)/settings');
    }
  }, [loading, profileLoading, profileError, user, profile, business]);

  return {
    business,
    error: profileError,
    loading: loading || profileLoading,
  };
}
