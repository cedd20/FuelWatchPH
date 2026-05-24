import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Zap, ShieldCheck, TrendingDown } from "lucide-react";
import { AuthBrand } from "@/shared/components/AuthBrand";
import { useAuth } from "@/app/providers/AuthContext";
import {
  clearStoredRememberedCredentials,
  getStoredRememberedCredentials,
  setStoredRememberedCredentials,
  setStoredRememberMePreference,
} from "@/shared/utils/authSession";
import { toast } from "sonner";
import { showAuthSuccessToast } from "@/shared/utils/authToast";

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const returnTo = location.state?.returnTo || "/app/map";

  useEffect(() => {
    const storedCredentials = getStoredRememberedCredentials();
    if (!storedCredentials) return;
    setEmail(storedCredentials.email || "");
    setPassword(storedCredentials.password || "");
    setRememberMe(true);
  }, []);

  const handleRememberMeChange = (checked) => {
    setRememberMe(checked);
    setStoredRememberMePreference(checked);
    if (!checked) clearStoredRememberedCredentials();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await login(email, password, { rememberMe });
      if (rememberMe) {
        setStoredRememberedCredentials(email, password);
      } else {
        clearStoredRememberedCredentials();
      }
      showAuthSuccessToast("Welcome back!", "You're now signed in.");
      const isAdminUser = result?.user?.role === "admin" || result?.user?.user_type === 0;
      if (isAdminUser) {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate(returnTo, { replace: true });
      }
    } catch (error) {
      const message = error.message || "";
      const lowerMessage = message.toLowerCase();
      if (lowerMessage.includes("email not confirmed")) {
        toast.error("Email not confirmed. Please check your inbox.");
      } else if (
        error.status === 400 ||
        lowerMessage.includes("invalid login credentials") ||
        lowerMessage.includes("invalid credentials") ||
        lowerMessage.includes("invalid_grant") ||
        lowerMessage.includes("invalid_credentials") ||
        lowerMessage.includes("bad credentials")
      ) {
        alert("Incorrect email or password. Please try again.");
        toast.error("Incorrect email or password. Please try again.");
      } else {
        toast.error(message || "An error occurred during login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    "app-auth-input w-full h-14 rounded-[1.15rem] pl-12 pr-12 text-sm font-semibold outline-none transition-all focus:border-emerald-400/55 focus:bg-[var(--app-auth-input-focus)] focus:ring-4 focus:ring-emerald-500/10";
  const secondaryLinkClass = "text-sm font-semibold text-[var(--app-auth-muted)] transition-colors hover:text-foreground dark:hover:text-white";

  return (
    <div className="app-auth-shell relative min-h-screen lg:flex lg:flex-row">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,rgba(33,115,95,0.24),transparent_58%)]" />
        <div className="absolute right-[-10%] top-[12%] h-72 w-72 rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute left-[-18%] bottom-[8%] h-72 w-72 rounded-full bg-teal-500/10 blur-[130px]" />
      </div>

      {/* Left Panel — Branding (desktop only) */}
      <div className="app-auth-aside relative hidden overflow-hidden border-r border-white/6 lg:flex lg:w-[52%] lg:flex-col lg:justify-between lg:px-16 lg:py-14">
        <div className="absolute top-0 right-0 h-[600px] w-[600px] translate-x-1/3 -translate-y-1/2 rounded-full bg-emerald-500/5 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] -translate-x-1/4 translate-y-1/2 rounded-full bg-teal-500/5 blur-[100px]" />

        <div className="relative z-10">
          <AuthBrand className="mb-14" />

          <h1 className="mb-5 text-5xl font-black leading-[0.95] tracking-[-0.05em] xl:text-6xl">
            Track fuel prices<br /><span className="text-emerald-400">smarter.</span>
          </h1>
          <p className="max-w-sm text-base font-semibold leading-7 text-[var(--app-auth-muted)]">
            Compare prices, find the cheapest stations nearby, and help the community with verified updates.
          </p>

          <div className="mt-11 space-y-4">
            {[
              { icon: TrendingDown, label: "Real-time price comparisons" },
              { icon: ShieldCheck, label: "Community-verified accuracy" },
              { icon: Zap, label: "Earn Karma for contributions" },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-4 rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                  <f.icon className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-sm font-semibold text-[#a6c3bc]">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-[10px] font-black uppercase tracking-[0.35em] text-[#53736C]">
          FuelWatch PH · Community Price Intel
        </p>
      </div>

      {/* Right Panel — Form */}
      <div className="relative flex min-h-screen flex-1 items-center px-4 py-6 sm:px-6 sm:py-8 lg:px-14 lg:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto w-full max-w-[27rem]"
        >
          <div className="app-auth-panel rounded-[2rem] border border-white/7 px-5 pb-6 pt-5 shadow-[0_24px_80px_rgba(0,0,0,0.24)] backdrop-blur xl:px-7 xl:pb-7 xl:pt-6">
            <button
              onClick={() => navigate(-1)}
              className="group mb-6 flex items-center gap-2 text-sm font-semibold text-[var(--app-auth-muted)] transition-colors hover:text-foreground dark:hover:text-white"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] transition-colors group-hover:border-emerald-400/30 group-hover:bg-white/[0.05]">
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              </span>
              Back
            </button>

            <div className="mb-7">
              <div className="mb-3 flex items-center gap-3 sm:gap-4">
                <AuthBrand compact className="shrink-0 lg:hidden" />
                <h2 className="text-[2rem] font-black tracking-[-0.04em] text-foreground sm:text-[2.15rem]">Welcome back.</h2>
              </div>
              <p className="max-w-sm text-sm font-medium leading-6 text-[var(--app-auth-muted)]">
                Sign in to your account to check nearby prices, track updates, and keep contributing.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-[18px]">
              <div>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-auth-subtle)]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    className={`${inputClass} pr-4`}
                    required
                  />
                </div>
              </div>

              <div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-auth-subtle)]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className={inputClass}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[var(--app-auth-subtle)] transition-colors hover:bg-white/[0.05] hover:text-foreground dark:hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <label className="flex cursor-pointer items-center gap-3 select-none">
                  <div
                    onClick={() => handleRememberMeChange(!rememberMe)}
                    className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all ${
                      rememberMe ? "border-emerald-400 bg-emerald-500" : "border-white/12 bg-[var(--app-surface-muted)]"
                    }`}
                  >
                    {rememberMe && <ShieldCheck className="w-3 h-3 text-white" strokeWidth={3} />}
                  </div>
                  <span className="text-sm font-semibold text-[var(--app-auth-muted)]">Remember Me</span>
                </label>
                <button type="button" className="text-sm font-semibold text-emerald-400 transition-colors hover:text-emerald-300">
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 flex h-[52px] w-full items-center justify-center rounded-[1.15rem] bg-gradient-to-r from-emerald-500 via-emerald-500 to-teal-500 text-[0.72rem] font-black uppercase tracking-[0.24em] text-white shadow-[0_18px_32px_rgba(16,185,129,0.22)] transition-all hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="mt-6 border-t border-white/7 pt-5 text-center">
              <button
                onClick={() => navigate("/app/map")}
                className={secondaryLinkClass}
              >
                Continue as Guest
              </button>
              <div className="mt-3 text-sm font-medium text-[var(--app-auth-subtle)]">
                Don&apos;t have an account?{" "}
                <button onClick={() => navigate("/signup")} className="font-semibold text-emerald-400 transition-colors hover:text-emerald-300">
                  Sign Up Free
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
