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
  const [bannedNotice, setBannedNotice] = useState("");
  const [bannedContext, setBannedContext] = useState(null);
  const [showAppealForm, setShowAppealForm] = useState(false);
  const [appealMessage, setAppealMessage] = useState("");
  const [appealImages, setAppealImages] = useState([]);
  const [isSendingAppeal, setIsSendingAppeal] = useState(false);

  const getBannedMessage = (profile) => {
    const banLabel = profile?.ban_reason_label ? ` Reason: ${profile.ban_reason_label}.` : "";
    return `User banned by admin. We promote a Filipino bayanihan culture here, and negativity is not welcome.${banLabel}`;
  };

  const clearBannedNotice = () => {
    setBannedNotice("");
    setBannedContext(null);
    setShowAppealForm(false);
    setAppealMessage("");
    setAppealImages([]);
  };

  const blockBannedUser = (message, context = null) => {
    setUser(null);
    setLoading(false);
    setBannedNotice(message);
    setBannedContext(context);
    setTimeout(() => {
      supabase.auth.signOut().catch(() => {});
    }, 0);
  };

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
          };
          await refreshProfile({ baseUser: basicUser, sessionOverride: session });
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
        const basicUser = {
          ...session.user,
        };
        try {
          await refreshProfile({ baseUser: basicUser, sessionOverride: session });
        } catch (error) {
          console.warn("Blocked authenticated session during profile refresh:", error);
        }
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

  const refreshProfile = async (options = {}) => {
    try {
      const { baseUser = null, sessionOverride = null } = options;
      const session = sessionOverride || (await supabase.auth.getSession()).data.session;
      // No session means user just signed out — do nothing silently
      if (!session) return null;

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'}/me/profile`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      // Silently ignore auth errors during sign-out — expected behavior
      if (res.status === 401) return null;
      if (res.status === 403) {
        const responseBody = await res.json().catch(() => ({}));
        if (responseBody?.detail?.code === "ACCOUNT_BANNED") {
          const bannedMessage = responseBody.detail.message || getBannedMessage();
          const context = {
            user_id: session?.user?.id,
            email: session?.user?.email,
            username:
              baseUser?.user_metadata?.username ||
              baseUser?.user_metadata?.full_name ||
              baseUser?.user_metadata?.name ||
              null,
          };
          blockBannedUser(bannedMessage, context);
          throw new Error(bannedMessage);
        }
      }
      if (!res.ok) throw new Error("Failed to fetch profile from API");
      const profile = await res.json();

      if (profile?.is_banned) {
        const bannedMessage = getBannedMessage(profile);
        const context = {
          user_id: profile?.id || session?.user?.id,
          email: profile?.email || session?.user?.email,
          username: profile?.username || baseUser?.user_metadata?.username || null,
          ban_reason: profile?.ban_reason || null,
          ban_reason_label: profile?.ban_reason_label || null,
        };
        blockBannedUser(bannedMessage, context);
        throw new Error(bannedMessage);
      }
      
      // Only update state if the user is still logged in (guards against race conditions)
      setUser(prev => {
        const currentUser = prev || baseUser;
        if (!currentUser) return prev;
        return {
          ...currentUser,
          ...profile,
          id: profile?.id || currentUser?.id,
          email: profile?.email || currentUser?.email || "",
          karma: profile?.points || profile?.reputation || 0,
          trustScore: profile?.accuracy || 0,
          avatar_url: profile?.avatar_url || currentUser?.avatar_url,
          bio: profile?.bio || "",
          is_banned: !!profile?.is_banned,
          ban_reason: profile?.ban_reason || null,
          ban_reason_label: profile?.ban_reason_label || null,
          initials: (profile?.username || currentUser?.name || 'U').substring(0, 1).toUpperCase(),
          name: profile?.username || currentUser?.name || 'User'
        };
      });
      return profile;
    } catch (e) {
      if (String(e?.message || "").toLowerCase().includes("user banned by admin")) {
        throw e;
      }
      // Only warn if it's not a sign-out-related abort
      if (!String(e).includes('Failed to fetch')) {
        console.warn("Profile refresh failed:", e);
      }
      throw e;
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin' || user?.user_type === 0,
    isAdminAuthenticated: user?.role === 'admin' || user?.user_type === 0,
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
            role: "admin",
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
          role: "user",
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
      let profile;
      try {
        profile = await refreshProfile({
          baseUser: data.user,
          sessionOverride: data.session,
        });
      } catch (authError) {
        await supabase.auth.signOut().catch(() => {});
        setUser(null);
        throw authError;
      }
      if (profile?.is_banned) {
        throw new Error(getBannedMessage(profile));
      }
      return { user: { ...data.user, ...profile } };
    },
    adminLogin: async (email, password, options = {}) => {
      console.log("Attempting admin login for:", email);
      const rememberMe = options.rememberMe ?? false;

      if (!isValidUrl) {
        const normalizedEmail = email.trim().toLowerCase();
        if (normalizedEmail === "admin@fuelwatch.ph" && password === "Admin1234!") {
          const mockAdmin = {
            id: "demo-admin-id",
            email: normalizedEmail,
            name: "FuelWatch Admin",
            initials: "FA",
            user_type: 0,
            role: "admin",
            karma: 9999,
            trustScore: 100,
          };
          setStoredRememberMePreference(rememberMe);
          setUser(mockAdmin);
          return { user: mockAdmin };
        }

        throw new Error("Admin access required. Use the FuelWatch admin credentials.");
      }

      setStoredRememberMePreference(rememberMe);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      let profile;
      try {
        profile = await refreshProfile({
          baseUser: data.user,
          sessionOverride: data.session,
        });
      } catch (authError) {
        await supabase.auth.signOut().catch(() => {});
        setUser(null);
        throw authError;
      }
      if (profile?.is_banned) {
        throw new Error(getBannedMessage(profile));
      }
      if (profile?.user_type !== 0) {
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) console.warn("Failed to sign out non-admin user after admin login attempt:", signOutError);
        setUser(null);
        throw new Error("Admin access required.");
      }
      return { user: { ...data.user, ...profile } };
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
      clearBannedNotice();
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
    bannedNotice,
    clearBannedNotice,
  };

  const sendAppeal = async () => {
    const trimmed = appealMessage.trim();
    if (trimmed.length < 5) throw new Error("Please describe your appeal.");

    const apiBase = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
    const formData = new FormData();
    formData.append("message", trimmed);
    if (bannedContext?.user_id) formData.append("user_id", bannedContext.user_id);
    if (bannedContext?.email) formData.append("email", bannedContext.email);
    if (bannedContext?.username) formData.append("username", bannedContext.username);
    if (bannedContext?.ban_reason) formData.append("ban_reason", bannedContext.ban_reason);
    if (bannedContext?.ban_reason_label) formData.append("ban_reason_label", bannedContext.ban_reason_label);

    for (const file of appealImages) {
      formData.append("attachments", file, file.name);
    }

    const res = await fetch(`${apiBase}/support/appeal`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.detail || "Failed to send appeal.");
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {bannedNotice && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(3,10,9,0.92)] px-6">
          <div className="w-full max-w-md rounded-[2rem] border border-rose-500/20 bg-[rgba(12,18,17,0.98)] p-8 text-center shadow-2xl shadow-black/40">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400">
              <span className="text-3xl font-black">!</span>
            </div>
            <h2 className="mb-3 text-2xl font-black text-white">Account Banned</h2>
            <p className="text-sm font-medium leading-7 text-[var(--app-text-soft)]">
              {bannedNotice}
            </p>

            {!showAppealForm ? (
              <div className="mt-7 space-y-3">
                <button
                  type="button"
                  onClick={() => setShowAppealForm(true)}
                  className="w-full rounded-2xl bg-white/10 px-5 py-4 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-white/15"
                >
                  Appeal
                </button>
                <button
                  type="button"
                  onClick={clearBannedNotice}
                  className="w-full rounded-2xl bg-rose-500 px-5 py-4 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-rose-400"
                >
                  Dismiss
                </button>
              </div>
            ) : (
              <div className="mt-6 text-left">
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-white/70">
                  Appeal Message
                </label>
                <textarea
                  value={appealMessage}
                  onChange={(e) => setAppealMessage(e.target.value)}
                  placeholder="Explain what happened and why you think this ban should be lifted..."
                  className="h-28 w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-medium text-white placeholder:text-white/35 outline-none focus:border-emerald-400/60"
                />

                <label className="mt-4 mb-2 block text-xs font-bold uppercase tracking-widest text-white/70">
                  Attach Images (optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setAppealImages(Array.from(e.target.files || []).slice(0, 5))}
                  className="block w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white file:mr-3 file:rounded-xl file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-xs file:font-black file:uppercase file:tracking-widest file:text-white hover:file:bg-white/15"
                />
                {appealImages.length > 0 && (
                  <div className="mt-2 text-xs font-semibold text-white/55">
                    {appealImages.length} attachment{appealImages.length === 1 ? "" : "s"} selected
                  </div>
                )}

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={isSendingAppeal}
                    onClick={async () => {
                      setIsSendingAppeal(true);
                      try {
                        await sendAppeal();
                        setShowAppealForm(false);
                        setAppealMessage("");
                        setAppealImages([]);
                      } catch (err) {
                        console.warn("Appeal send failed:", err);
                        alert(err?.message || "Failed to send appeal.");
                      } finally {
                        setIsSendingAppeal(false);
                      }
                    }}
                    className="rounded-2xl bg-emerald-500 px-4 py-4 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSendingAppeal ? "Sending..." : "Send Appeal"}
                  </button>
                  <button
                    type="button"
                    disabled={isSendingAppeal}
                    onClick={() => setShowAppealForm(false)}
                    className="rounded-2xl bg-white/10 px-4 py-4 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </div>

                <button
                  type="button"
                  disabled={isSendingAppeal}
                  onClick={clearBannedNotice}
                  className="mt-3 w-full rounded-2xl bg-rose-500 px-5 py-4 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
