import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { Profile } from "@vak/contract";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isEmployee: boolean;
  signOut: () => Promise<void>;
  signUp: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{ error: Error | null }>;
  login: (
    email: string,
    password: string
  ) => Promise<{ data?: any; error?: string; pendingApproval?: boolean }>;
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

  const clearAuthState = () => {
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const isInvalidRefreshTokenError = (error: any) => {
    const message = String(error?.message ?? "").toLowerCase();
    return (
      message.includes("invalid refresh token") ||
      message.includes("refresh token not found")
    );
  };

  const safeSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Error signing out:", err);
    } finally {
      clearAuthState();
    }
  };

  const getSafeSession = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        if (isInvalidRefreshTokenError(error)) {
          await safeSignOut();
          return null;
        }
        throw error;
      }

      return data.session ?? null;
    } catch (err) {
      if (isInvalidRefreshTokenError(err)) {
        await safeSignOut();
        return null;
      }

      console.error("Error getting session:", err);
      return null;
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      const currentSession = await getSafeSession();

      if (!currentSession?.user) {
        clearAuthState();
        setLoading(false);
        return;
      }

      await fetchProfile(currentSession.user.id);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!nextSession?.user) {
        clearAuthState();
        setLoading(false);
        return;
      }

      await fetchProfile(nextSession.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error || !data) {
        await safeSignOut();
        return;
      }

      if (data.role !== "EMPLOYEE") {
        await safeSignOut();
        return;
      }

      const currentSession = await getSafeSession();

      if (!currentSession?.user) {
        clearAuthState();
        return;
      }

      setSession(currentSession);
      setUser(currentSession.user);
      setProfile(data as Profile);
    } catch (err) {
      console.error("Unexpected error fetching profile:", err);
      clearAuthState();
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (data?.user?.id) {
      await supabase.from("profiles").insert({
        id: data.user.id,
        full_name: fullName,
        role: "EMPLOYEE",
        is_approved: false,
      });
    }

    return { error };
  };

  const signOut = async () => {
    await safeSignOut();
  };

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
        await safeSignOut();
        return { error: "PROFILE_ERROR" };
      }

      if (profileData.role !== "EMPLOYEE") {
        await safeSignOut();
        return { error: "ACCESS_DENIED" };
      }

      setSession(loginData.session);
      setUser(loginData.user);
      setProfile(profileData as Profile);

      if (!profileData.is_approved) {
        return { pendingApproval: true };
      }

      return { data: loginData };
    } catch (err) {
      console.error(err);
      return { error: "UNKNOWN_ERROR" };
    }
  };

  const isAdmin = profile?.role === "OWNER";
  const isManager = profile?.role === "MANAGER" || isAdmin;
  const isEmployee = profile?.role === "EMPLOYEE";

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        isAdmin,
        isManager,
        isEmployee,
        signOut,
        signUp,
        login,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};