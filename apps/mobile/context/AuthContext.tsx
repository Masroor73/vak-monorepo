import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '@vak/contract';

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
  login: (email: string, password: string) => Promise<{ data?: any; error?: string; pendingApproval?: boolean }>; // ← updated
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
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // -------------------- Auth state initialization --------------------
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setLoading(false);
        return;
      }
      await fetchProfile(session.user.id);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      await fetchProfile(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  // -------------------- Fetch profile --------------------
  const fetchProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !data) {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setProfile(null);
      return;
    }

    // Only allow employees
    if (data.role !== "EMPLOYEE") {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setProfile(null);
      return;
    }

    if (!data.is_approved) {
      const { data: currentSession } = await supabase.auth.getSession();
      setSession(currentSession.session ?? null);
      setUser(currentSession.session?.user ?? null);
      setProfile(data as Profile);
      return;
    }

    // Valid employee
    const { data: currentSession } = await supabase.auth.getSession();

    setSession(currentSession.session ?? null);
    setUser(currentSession.session?.user ?? null);
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

  // -------------------- Sign up --------------------
  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    return { error };
  };

  // -------------------- Sign out --------------------
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  // -------------------- Login --------------------
  const login = async (email: string, password: string) => {
  try {
    const { data: loginData, error } =
      await supabase.auth.signInWithPassword({ email, password });

    if (error || !loginData.session) {
      return { error: "INVALID_CREDENTIALS" };
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", loginData.user.id)
      .single();

    if (profileError || !profileData) {
      await supabase.auth.signOut();
      return { error: "PROFILE_ERROR" };
    }

    if (profileData.role !== "EMPLOYEE") {
      await supabase.auth.signOut();
      return { error: "ACCESS_DENIED" };
    }

    if (!profileData.is_approved) {
      setSession(loginData.session);
      setUser(loginData.user);
      setProfile(profileData as Profile);
      return { pendingApproval: true }; 
    }

    setSession(loginData.session);
    setUser(loginData.user);
    setProfile(profileData as Profile);

    return { data: loginData };

  } catch (err) {
    console.error(err);
    return { error: "UNKNOWN_ERROR" };
  }
};

// -------------------- Role helpers --------------------
  const isAdmin = profile?.role === 'OWNER';
  const isManager = profile?.role === 'MANAGER' || isAdmin;
  const isEmployee = profile?.role === "EMPLOYEE";

  // -------------------- Provider --------------------
  return (
    <AuthContext.Provider 
      value={{ session, user, profile, loading, isAdmin, isManager, isEmployee, signOut, signUp, login }}
    >
      {children}
    </AuthContext.Provider>
  );
};