import { createContext, useContext, useEffect, useState } from "react";
import { supabase, isValidUrl } from "../../lib/supabase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUser() {
      try {
        if (!isValidUrl) {
          console.warn("Supabase credentials missing, providing mock user session.");
          setUser({
            id: 'demo-user-id',
            email: 'user@fuelwatch.ph',
            name: 'FuelWatch Explorer',
            initials: 'FE',
            contributionCount: 142,
            accuracy: 98,
            points: 2500,
            rank: 'Gold Contributor'
          });
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

          // Enrich asynchronously
          (async () => {
            try {
              const { data: profile } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
              
              const { count } = await supabase
                .from('price_reports')
                .select('*', { count: 'exact', head: true })
                .eq('reported_by', session.user.id);

              setUser(prev => ({
                ...prev,
                ...profile,
                contributionCount: count || 0,
                points: profile?.reputation || 0,
                avatar_url: profile?.avatar_url || prev?.avatar_url,
                bio: profile?.bio || "",
                initials: (profile?.username || prev?.name || 'U').substring(0, 1).toUpperCase(),
                name: profile?.username || prev?.name || 'User'
              }));
            } catch (e) {
              console.warn("Initial enrichment failed:", e);
            }
          })();
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
        const enrichUser = async () => {
          try {
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            const { count } = await supabase
              .from('price_reports')
              .select('*', { count: 'exact', head: true })
              .eq('reported_by', session.user.id);

            setUser(prev => ({
              ...prev,
              ...profile,
              contributionCount: count || 0,
              points: profile?.reputation || 0,
              avatar_url: profile?.avatar_url || prev?.avatar_url,
              bio: profile?.bio || "",
              initials: (profile?.username || prev?.name || 'U').substring(0, 1).toUpperCase(),
              name: profile?.username || prev?.name || 'User'
            }));
          } catch (e) {
            console.warn("Enrichment failed:", e);
          }
        };
        
        enrichUser();
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login: async (email, password) => {
      console.log("Attempting login for:", email);
      if (!isValidUrl) throw new Error("Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.");
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      console.log("Login response:", { data, error });
      if (error) throw error;
      return data;
    },
    signUp: async (email, password, metadata) => {
      console.log("Attempting signup for:", email);
      if (!isValidUrl) throw new Error("Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.");
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata }
      });
      console.log("Signup response:", { data, error });
      return { data, error };
    },
    logout: async () => {
      console.log("Attempting logout");
      if (!isValidUrl) {
        setUser(null);
        return;
      }
      const { error } = await supabase.auth.signOut();
      console.log("Logout response:", { error });
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
