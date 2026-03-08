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
    // Wait until auth state is resolved before making any redirect decision
    if (loading) return;

    // No session at all → send to login
    if (!session) {
      router.replace('/login');
      return;
    }

    // Session exists but account is pending admin approval
    if (!isApproved) {
      router.replace('/pendingApproval');
      return;
    }

    // Approved but EMPLOYEE role → belongs on mobile, not web dashboard
    if (profile?.role === 'EMPLOYEE') {
      router.replace('/login');
      return;
    }

    // Approved + MANAGER or OWNER → allowed, do nothing
  }, [loading, session, isApproved, profile, router]);

  return { loading, isApproved };
};