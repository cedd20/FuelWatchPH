import { createContext, useContext, useEffect, useState } from "react";
import { supabase, isValidUrl, setStoredRememberMePreference } from "../../lib/supabase";
import { KarmaService } from "../../lib/karmaService";
import {
  clearMockAuthSession,
  getMockAuthSession,
  setMockAuthSession,
  getStoredRememberedCredentials,
} from "@/shared/utils/authSession";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUser() {
      try {
        if (!isValidUrl) {
          const mockSession = getStoredRememberedCredentials(); // Check if we have remembered mock credentials
          if (mockSession?.email === "admin@fuelwatch.ph") {
             setUser({
                id: "demo-admin-id",
                email: mockSession.email,
                name: "FuelWatch Admin",
                initials: "FA",
                user_type: 0,
                karma: 9999,
                trustScore: 100,
              });
          } else if (mockSession?.email === "test@fuelwatch.ph") {
             setUser({
                id: "demo-user-id",
                email: mockSession.email,
                name: "FuelWatch Explorer",
                initials: "FE",
                user_type: 1,
                karma: 100,
                trustScore: 95,
              });
          }
          setLoading(false);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const basicUser = {
            ...session.user,
            initials: (session.user.user_metadata?.full_name || session.user.email || 'U').substring(0, 1).toUpperCase(),
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User'
          };
          setUser(basicUser);

          // Enrich asynchronously using backend API for calculated stats (accuracy, contributionCount)
          refreshProfile();
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setLoading(false);
      }
    }

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth event:", event, session?.user?.id);
      
      if (session?.user) {
        // Set basic user immediately to unblock UI
        const basicUser = {
          ...session.user,
          initials: (session.user.user_metadata?.full_name || session.user.email || 'U').substring(0, 1).toUpperCase(),
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User'
        };
        setUser(basicUser);

        // Enrich asynchronously
        refreshProfile();
      } else {
        setUser(null);
      }

      setLoading(false);
    });
    
    // Listen for local Karma updates
    const handleStorageChange = () => {
      setUser(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          karma: KarmaService.getKarma(),
          trustScore: KarmaService.getTrustScore(),
          contributionCount: (prev.total_updates || 0) + KarmaService.getContributions().length
        };
      });
    };
    
    window.addEventListener('storage', handleStorageChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const refreshProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      // No session means user just signed out — do nothing silently
      if (!session) return;

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'}/me/profile`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      // Silently ignore auth errors during sign-out — expected behavior
      if (res.status === 401 || res.status === 403) return;
      if (!res.ok) throw new Error("Failed to fetch profile from API");
      const profile = await res.json();
      
      // Only update state if the user is still logged in (guards against race conditions)
      setUser(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          ...profile,
          karma: profile?.points || profile?.reputation || 0,
          trustScore: profile?.accuracy || 0,
          avatar_url: profile?.avatar_url || prev?.avatar_url,
          bio: profile?.bio || "",
          initials: (profile?.username || prev?.name || 'U').substring(0, 1).toUpperCase(),
          name: profile?.username || prev?.name || 'User'
        };
      });
    } catch (e) {
      // Only warn if it's not a sign-out-related abort
      if (!String(e).includes('Failed to fetch')) {
        console.warn("Profile refresh failed:", e);
      }
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.user_type === 0,
    loading,
    refreshProfile,
    login: async (email, password, options = {}) => {
      console.log("Attempting login for:", email);
      const rememberMe = options.rememberMe ?? false;

      if (!isValidUrl) {
        const normalizedEmail = email.trim().toLowerCase();
        
        // Mock Admin
        if (normalizedEmail === "admin@fuelwatch.ph" && password === "Admin1234!") {
          const mockAdmin = {
            id: "demo-admin-id",
            email: normalizedEmail,
            name: "FuelWatch Admin",
            initials: "FA",
            user_type: 0,
            karma: 9999,
            trustScore: 100,
          };
          setStoredRememberMePreference(rememberMe);
          setUser(mockAdmin);
          return { user: mockAdmin };
        }

        const isValidMockLogin =
          normalizedEmail === "test@fuelwatch.ph" && password === "Test1234!";

        if (!isValidMockLogin) {
          throw new Error("Invalid email or password. Use the dev test account for mock login.");
        }

        const mockUser = {
          id: "demo-user-id",
          email: normalizedEmail,
          name: "FuelWatch Explorer",
          initials: "FE",
          user_type: 1,
          contributionCount: 142 + KarmaService.getContributions().length,
          trustScore: KarmaService.getTrustScore(),
          karma: KarmaService.getKarma(),
          rank: "Gold Contributor",
        };

        setStoredRememberMePreference(rememberMe);
        setUser(mockUser);
        return { user: mockUser };
      }

      setStoredRememberMePreference(rememberMe);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      // Refresh profile to get user_type immediately after login
      await refreshProfile();
      
      return data;
    },
    signUp: async (email, password, metadata) => {
      console.log("Attempting signup for:", email);
      if (!isValidUrl) throw new Error("Supabase is not configured.");
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata }
      });
      return { data, error };
    },
    logout: async () => {
      console.log("Attempting logout");
      if (!isValidUrl) {
        setUser(null);
        return;
      }
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    },
    resendVerification: async (email) => {
      if (!isValidUrl) throw new Error("Supabase is not configured.");
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      if (error) throw error;
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
