import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Zap,
  ShieldCheck,
  TrendingDown,
} from "lucide-react";
import { AuthBrand } from "@/shared/components/AuthBrand";
import { useAuth } from "@/app/providers/AuthContext";
import { toast } from "sonner";
import { showAuthSuccessToast } from "@/shared/utils/authToast";

// NOTE: Email confirmation is disabled in Supabase Dashboard for development.
// Re-enable before production deployment.

export function SignUp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signUp, resendVerification } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const returnTo = location.state?.returnTo || "/app/map";

  const handleSignUp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError("");

    try {
      const { data, error } = await signUp(email, password, { full_name: name });

      if (error) {
        if (error.status === 429 || error.message?.includes("rate limit")) {
          setFormError("Too many sign-up attempts. Please wait a few minutes and try again.");
        } else if (error.message?.includes("already registered") || error.message?.includes("User already registered")) {
          setFormError("This email is already registered. Try logging in instead.");
        } else {
          setFormError(error.message || "Sign up failed. Please try again.");
        }
        return;
      }

      if (data?.user) {
        if (!data.session) {
          setIsEmailSent(true);
          toast.success("Account created! Please check your email to verify.");
        } else {
          showAuthSuccessToast("Account created successfully!", "Welcome to FuelWatch PH!");
          navigate(returnTo, { replace: true });
        }
      }
    } catch (err) {
      if (err.message?.includes("rate limit")) {
        setFormError("Too many sign-up attempts. Please wait a few minutes and try again.");
      } else {
        setFormError(err.message || "An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await resendVerification(email);
      toast.success("Verification email resent!");
    } catch (err) {
      toast.error(err.message || "Failed to resend verification email.");
    } finally {
      setIsResending(false);
    }
  };

  const inputClass =
    "w-full h-14 rounded-[1.15rem] border border-white/8 bg-[#193834]/88 pl-12 pr-12 text-sm font-semibold text-white outline-none transition-all placeholder:text-[#6F8E88] focus:border-emerald-400/55 focus:bg-[#1D413B] focus:ring-4 focus:ring-emerald-500/10";
  const sectionLabelClass = "mb-2.5 block text-[0.65rem] font-black uppercase tracking-[0.28em] text-[#6F8E88]";
  const secondaryLinkClass = "text-sm font-semibold text-[#8EB3AB] transition-colors hover:text-white";

  // ── Email Sent Confirmation Screen ──────────────────────────────────────────
  if (isEmailSent) {
    return (
      <div className="relative min-h-screen bg-[#050A09] px-5 text-center text-white">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 h-[500px] w-[500px] translate-x-1/3 -translate-y-1/2 rounded-full bg-emerald-500/8 blur-[120px]" />
          <div className="absolute bottom-[8%] left-[-10%] h-64 w-64 rounded-full bg-teal-500/8 blur-[120px]" />
        </div>
        <div className="flex min-h-screen items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 w-full max-w-md rounded-[2rem] border border-white/7 bg-[linear-gradient(180deg,rgba(25,56,52,0.96),rgba(10,21,18,0.98))] px-6 py-7 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur"
          >
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-gradient-to-br from-emerald-500 to-teal-600 shadow-[0_18px_36px_rgba(16,185,129,0.22)]">
              <Mail className="h-10 w-10 text-white" strokeWidth={2.5} />
            </div>
            <h2 className="mb-3 text-3xl font-black tracking-[-0.04em]">Check your email</h2>
            <p className="mb-8 text-sm font-medium leading-6 text-[#8AA8A1]">
              We've sent a verification link to{" "}
              <span className="text-emerald-400">{email}</span>. Click the link to activate your account.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate("/login")}
                className="flex h-[52px] w-full items-center justify-center rounded-[1.15rem] bg-gradient-to-r from-emerald-500 via-emerald-500 to-teal-500 text-[0.72rem] font-black uppercase tracking-[0.24em] text-white shadow-[0_18px_32px_rgba(16,185,129,0.22)] transition-all hover:brightness-105"
              >
                Go to Sign In
              </button>
              <button
                onClick={handleResend}
                disabled={isResending}
                className="flex h-[52px] w-full items-center justify-center rounded-[1.15rem] border border-white/8 bg-[#193834]/88 text-[0.72rem] font-black uppercase tracking-[0.24em] text-white transition-all hover:border-emerald-400/30 disabled:opacity-50"
              >
                {isResending ? "Resending..." : "Resend Email"}
              </button>
              <button
                onClick={() => setIsEmailSent(false)}
                className="pt-2 text-sm font-semibold text-[#8EB3AB] transition-colors hover:text-white"
              >
                Entered wrong email? Go back
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Sign Up Form ─────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen bg-[#050A09] text-white lg:flex lg:flex-row">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,rgba(33,115,95,0.24),transparent_58%)]" />
        <div className="absolute right-[-10%] top-[12%] h-72 w-72 rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute left-[-18%] bottom-[8%] h-72 w-72 rounded-full bg-teal-500/10 blur-[130px]" />
      </div>

      {/* Left Panel — Branding (desktop only) */}
      <div className="relative hidden overflow-hidden border-r border-white/6 bg-[#10211E] lg:flex lg:w-[52%] lg:flex-col lg:justify-between lg:px-16 lg:py-14">
        <div className="absolute top-0 right-0 h-[600px] w-[600px] translate-x-1/3 -translate-y-1/2 rounded-full bg-emerald-500/5 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] -translate-x-1/4 translate-y-1/2 rounded-full bg-teal-500/5 blur-[100px]" />

        <div className="relative z-10">
          <AuthBrand className="mb-14" />

          <h1 className="mb-5 text-5xl font-black leading-[0.95] tracking-[-0.05em] xl:text-6xl">
            Join the<br /><span className="text-emerald-400">community.</span>
          </h1>
          <p className="max-w-sm text-base font-semibold leading-7 text-[#7E9C95]">
            Help other Filipinos save money on fuel by contributing real price data from stations near you.
          </p>

          <div className="mt-11 space-y-4">
            {[
              { icon: TrendingDown, label: "Compare prices across brands" },
              { icon: ShieldCheck, label: "Build trust through contributions" },
              { icon: Zap, label: "Earn Karma & climb the leaderboard" },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-4 rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                  <f.icon className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-sm font-semibold text-[#A6C3BC]">{f.label}</span>
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
          <div className="rounded-[2rem] border border-white/7 bg-[linear-gradient(180deg,rgba(25,56,52,0.96),rgba(10,21,18,0.98))] px-5 pb-6 pt-5 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur xl:px-7 xl:pb-7 xl:pt-6">
            <button
              onClick={() => navigate(-1)}
              className="group mb-6 flex items-center gap-2 text-sm font-semibold text-[#7F9B95] transition-colors hover:text-white"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] transition-colors group-hover:border-emerald-400/30 group-hover:bg-white/[0.05]">
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              </span>
              Back
            </button>

            <AuthBrand compact className="mb-6 lg:hidden" />

            <div className="mb-7">
              <h2 className="mb-2 text-[2rem] font-black tracking-[-0.04em] text-white sm:text-[2.15rem]">Create account.</h2>
              <p className="max-w-sm text-sm font-medium leading-6 text-[#8AA8A1]">
                Join the community and start saving on fuel with faster price checks and trusted updates.
              </p>
            </div>

            <form onSubmit={handleSignUp} className="space-y-[18px]">
              <div>
                <label className={sectionLabelClass}>Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6F8E88]" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Juan Dela Cruz"
                    className={`${inputClass} pr-4`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={sectionLabelClass}>Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6F8E88]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={`${inputClass} pr-4`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={sectionLabelClass}>Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6F8E88]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className={inputClass}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[#7A9891] transition-colors hover:bg-white/[0.05] hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <p className="text-[0.72rem] font-semibold leading-5 text-[#6E8A84]">
                By signing up, you agree to our{" "}
                <button type="button" onClick={() => navigate("/app/terms")} className="font-semibold text-emerald-400 transition-colors hover:text-emerald-300">
                  Terms & Privacy Policy
                </button>
                .
              </p>

              {formError && (
                <div className="rounded-[1.15rem] border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-300">
                  {formError}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 flex h-[52px] w-full items-center justify-center rounded-[1.15rem] bg-gradient-to-r from-emerald-500 via-emerald-500 to-teal-500 text-[0.72rem] font-black uppercase tracking-[0.24em] text-white shadow-[0_18px_32px_rgba(16,185,129,0.22)] transition-all hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            <div className="mt-6 border-t border-white/7 pt-5 text-center">
              <button
                onClick={() => navigate("/app/map")}
                className={secondaryLinkClass}
              >
                Continue as Guest
              </button>
              <div className="mt-3 text-sm font-medium text-[#73918A]">
                Already have an account?{" "}
                <button onClick={() => navigate("/login")} className="font-semibold text-emerald-400 transition-colors hover:text-emerald-300">
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
