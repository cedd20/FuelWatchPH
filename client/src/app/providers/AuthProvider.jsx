import { createContext, useContext, useEffect, useState } from "react";
import { supabase, isValidUrl } from "../../lib/supabase";
import { getMockAuthenticatedUser, isAuthBypassEnabled } from "./authBypass";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUser() {
      try {
        // TEMP: Auth bypass enabled for frontend testing only.
        // Re-enable when backend/auth is ready.
        if (isAuthBypassEnabled()) {
          setUser(getMockAuthenticatedUser());
          setLoading(false);
          return;
        }

        if (!isValidUrl) {
          console.warn("Supabase credentials missing, providing mock user session.");
          setUser(getMockAuthenticatedUser());
          setLoading(false);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setLoading(false);
      }
    }

    getUser();

    // TEMP: Auth bypass enabled for frontend testing only.
    // Re-enable when backend/auth is ready.
    if (isAuthBypassEnabled()) {
      return undefined;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login: async (email, password) => {
      // TEMP: Auth bypass enabled for frontend testing only.
      // Re-enable when backend/auth is ready.
      if (isAuthBypassEnabled()) {
        const mockUser = getMockAuthenticatedUser();
        setUser(mockUser);
        return { user: mockUser, session: { user: mockUser } };
      }

      if (!isValidUrl) throw new Error("Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.");
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    },
    signUp: async (email, password, metadata) => {
      // TEMP: Auth bypass enabled for frontend testing only.
      // Re-enable when backend/auth is ready.
      if (isAuthBypassEnabled()) {
        const mockUser = {
          ...getMockAuthenticatedUser(),
          email,
          name: metadata?.full_name || getMockAuthenticatedUser().name,
        };
        setUser(mockUser);
        return { user: mockUser, session: { user: mockUser } };
      }

      if (!isValidUrl) throw new Error("Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.");
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata }
      });
      if (error) throw error;
      return data;
    },
    logout: async () => {
      // TEMP: Auth bypass enabled for frontend testing only.
      // Re-enable when backend/auth is ready.
      if (isAuthBypassEnabled()) {
        setUser(getMockAuthenticatedUser());
        return;
      }

      if (!isValidUrl) {
        setUser(null);
        return;
      }
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
