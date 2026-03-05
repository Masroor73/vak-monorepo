import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function Index() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!session) {
      // Not logged in - go to login
      router.replace('/(public)/login');
    } else {
      // Logged in - go to dashboard
      router.replace('/(tabs)');
    }
  }, [session, loading]);

  return null; // Nothing to show while redirecting
}