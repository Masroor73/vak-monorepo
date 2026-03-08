import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

/**
 * Root index — single entry point for all web navigation.
 *
 * Runs on every app launch and handles the top-level redirect:
 *  - Loading          → show nothing (we don't want to flash the login screen while we check auth)
 *  - No session       → /login
 *  - !is_approved     → /pendingApproval
 *  - EMPLOYEE role    → /login  (wrong platform)
 *  - MANAGER / OWNER  → /dashboard
 *
 * Note: This only runs on launch. For direct URL access protection,
 * every protected page also uses the useAuthGuard() hook.
 */
export default function Index() {
  const { session, profile, loading, isApproved } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!session) {
      router.replace('/(public)/login');
      return;
    }

    if (!isApproved) {
      router.replace('/(public)/pendingApproval');
      return;
    }

    router.replace('/(tabs)');
  }, [session, profile, loading, isApproved]);

  return null;
}