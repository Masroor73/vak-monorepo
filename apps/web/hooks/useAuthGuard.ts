//web/hooks/useAuthGuard.ts
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

/**
 * useAuthGuard
 *
 * Drop this hook at the top of every protected web page.
 * It re-checks is_approved and role on every render, so even if a user
 * types a URL directly into the browser they will be redirected correctly.
 *
 * Redirect logic:
 *  - No session              → /login
 *  - Session + !is_approved  → /pendingApproval
 *  - Session + EMPLOYEE role → /login  (employee belongs on mobile, not web)
 *  - Session + approved + MANAGER or OWNER → allowed through
 */
export const useAuthGuard = () => {
  const { session, profile, loading, isApproved } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!session) {
      router.replace('/(public)/login');
      return;
    }

    if (!profile) return; 

    if (!isApproved) {
      router.replace('/(public)/pendingApproval');
      return;
    }

    if (profile?.role === 'EMPLOYEE') {
      router.replace('/(public)/login');
      return;
    }

  }, [loading, session, isApproved, profile, router]);
  
};