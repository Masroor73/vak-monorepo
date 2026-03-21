// apps/mobile/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { createSupabaseClient, supabase } from '../lib/supabase';
import { Profile } from '@vak/contract';
import { signInWithGoogle as signInWithGoogleUtil } from "../lib/googleAuth";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isEmployee: boolean;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  login: (email: string, password: string, rememberMe: boolean) => Promise<{ data?: any; error?: string; pendingApproval?: boolean }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  isManager: false,
  isEmployee: false,
  signOut: async () => {},
  signUp: async () => ({ error: null }),
  login: async () => ({ error: "Not implemented" }),
  signInWithGoogle: async () => ({ error: "Not implemented" }),
});

export const useAuth = () => useContext(AuthContext);

// -------------------- Persistent client reused across app --------------------
const persistentClient = createSupabaseClient(true);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser]       = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // -------------------- Fetch profile helper --------------------
  const fetchProfile = async (
    userId: string,
    activeSession: Session,
    activeUser: User,
    client: ReturnType<typeof createSupabaseClient>
  ) => {
    try {
      const { data, error } = await client
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error || !data) {
        await client.auth.signOut();
        setSession(null);
        setUser(null);
        setProfile(null);
        return;
      }

      if (data.role !== "EMPLOYEE") {
        await client.auth.signOut();
        setSession(null);
        setUser(null);
        setProfile(null);
        return;
      }

      // inject session into default supabase client
      // so all screens/hooks that import { supabase } get an authenticated client
      await supabase.auth.setSession({
        access_token: activeSession.access_token,
        refresh_token: activeSession.refresh_token,
      });

      setSession(activeSession);
      setUser(activeUser);
      setProfile(data as Profile);

    } catch (err) {
      console.error("Unexpected error fetching profile:", err);
      setSession(null);
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  // -------------------- Auth state initialization --------------------
  useEffect(() => {
    const init = async () => {
      // Check persistent client first (rememberMe sessions)
      const { data: { session: persistedSession } } = await createSupabaseClient(true).auth.getSession();
      if (persistedSession?.user) {
        await fetchProfile(
          persistedSession.user.id,
          persistedSession,
          persistedSession.user,
          createSupabaseClient(true)
        );
        return;
      }

      // Check memory client (non-remembered sessions)
      const { data: { session: memorySession } } = await createSupabaseClient(false).auth.getSession();
      if (memorySession?.user) {
        await fetchProfile(
          memorySession.user.id,
          memorySession,
          memorySession.user,
          createSupabaseClient(false)
        );
        return;
      }

      // No session found
      setLoading(false);
    };

    init();

    // Always listen for auth state changes on the persistent client
    const { data: { subscription } } = persistentClient.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      await fetchProfile(session.user.id, session, session.user, persistentClient);
    });

    return () => subscription.unsubscribe();
  }, []);

  // -------------------- Sign up --------------------
  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await persistentClient.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (data?.user?.id) {
      await persistentClient.from("profiles").insert({
        id: data.user.id,
        full_name: fullName,
        role: "EMPLOYEE",
        is_approved: false,
      });
    }

    return { error };
  };

  // -------------------- Sign out --------------------
  const signOut = async () => {
    try {
      await persistentClient.auth.signOut();
      //  also clear the injected session from default client
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  // -------------------- Login --------------------
  const login = async (email: string, password: string, rememberMe: boolean) => {
    try {
      const client = rememberMe ? persistentClient : createSupabaseClient(false);
      const { data: loginData, error } = await client.auth.signInWithPassword({ email, password });

      if (error || !loginData.session) return { error: "INVALID_CREDENTIALS" };

      const { data: profileData, error: profileError } = await client
        .from("profiles")
        .select("*")
        .eq("id", loginData.user.id)
        .single();

      if (profileError || !profileData) return { error: "PROFILE_ERROR" };

      if (profileData.role !== "EMPLOYEE") {
        await client.auth.signOut();
        return { error: "ACCESS_DENIED" };
      }

      setSession(loginData.session);
      setUser(loginData.user);
      setProfile(profileData as Profile);

      // inject session into default supabase client
      await supabase.auth.setSession({
        access_token: loginData.session.access_token,
        refresh_token: loginData.session.refresh_token,
      });

      if (!profileData.is_approved) return { pendingApproval: true };

      return { data: loginData };

    } catch (err) {
      console.error("LOGIN CATCH ERROR:", err);
      return { error: "UNKNOWN_ERROR" };
    }
  };

  // -------------------- Google Sign In --------------------
  const signInWithGoogle = async (): Promise<{ error?: string }> => {
    try {
      const success = await signInWithGoogleUtil();
      if (!success) return { error: "CANCELLED" };
      // Google sign in fires onAuthStateChange on persistentClient
      // which calls fetchProfile which injects into default client — covered
      return {};
    } catch (err: any) {
      console.error("Google sign in error:", err);
      return { error: err.message ?? "UNKNOWN_ERROR" };
    }
  };

  // -------------------- Role helpers --------------------
  const isAdmin    = profile?.role === 'OWNER';
  const isManager  = profile?.role === 'MANAGER' || isAdmin;
  const isEmployee = profile?.role === 'EMPLOYEE';

  return (
    <AuthContext.Provider
      value={{ session, user, profile, loading, isAdmin, isManager, isEmployee, signOut, signUp, login, signInWithGoogle }}
    >
      {children}
    </AuthContext.Provider>
  );
};