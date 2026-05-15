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
  CheckCircle2,
} from "lucide-react";
import { Logo } from "@/shared/components/Logo";
import { useAuth } from "@/app/providers/AuthContext";
import { toast } from "sonner";

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
          toast.success("Account created successfully! Welcome to FuelWatch PH.");
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
    "w-full bg-[#0C1A17] border border-emerald-500/10 rounded-2xl p-5 text-sm font-bold text-white placeholder:text-gray-700 focus:border-emerald-500/50 focus:outline-none transition-all";

  // ── Email Sent Confirmation Screen ──────────────────────────────────────────
  if (isEmailSent) {
    return (
      <div className="min-h-screen bg-[#050A09] text-white flex flex-col items-center justify-center px-6 text-center">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full relative z-10"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/30">
            <Mail className="w-12 h-12 text-white" strokeWidth={2.5} />
          </div>
          <h2 className="text-4xl font-black tracking-tight mb-3">Check your email</h2>
          <p className="text-gray-500 font-bold leading-relaxed mb-10">
            We've sent a verification link to{" "}
            <span className="text-emerald-400">{email}</span>. Click the link to activate your account.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate("/login")}
              className="w-full py-5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/20 hover:scale-[1.01] transition-all"
            >
              Go to Sign In
            </button>
            <button
              onClick={handleResend}
              disabled={isResending}
              className="w-full py-5 bg-[#0C1A17] border border-emerald-500/10 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:border-emerald-500/30 transition-all disabled:opacity-50"
            >
              {isResending ? "Resending..." : "Resend Email"}
            </button>
            <button
              onClick={() => setIsEmailSent(false)}
              className="text-gray-600 hover:text-gray-400 font-bold text-sm transition-colors pt-2"
            >
              Entered wrong email? Go back
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Sign Up Form ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#050A09] text-white flex flex-col lg:flex-row">
      {/* Left Panel — Branding (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0C1A17] border-r border-emerald-500/10 flex-col justify-between p-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-500/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-20">
            <Logo size="sm" />
            <span className="font-black text-lg tracking-tight">FuelWatch PH</span>
          </div>

          <h1 className="text-6xl font-black tracking-tighter leading-none mb-6">
            Join the<br /><span className="text-emerald-400">community.</span>
          </h1>
          <p className="text-gray-500 font-bold leading-relaxed max-w-sm">
            Help other Filipinos save money on fuel by contributing real price data from stations near you.
          </p>

          <div className="mt-12 space-y-4">
            {[
              { icon: TrendingDown, label: "Compare prices across brands" },
              { icon: ShieldCheck, label: "Build trust through contributions" },
              { icon: Zap, label: "Earn Karma & climb the leaderboard" },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <f.icon className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="font-bold text-sm text-gray-400">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-[10px] font-black text-gray-700 uppercase tracking-widest">
          FuelWatch PH · Community Price Intel
        </p>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto w-full"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-white font-bold text-sm mb-10 transition-all hover:gap-3 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Back
          </button>

          {/* Mobile Logo */}
          <div className="flex items-center gap-3 mb-2 lg:hidden">
            <Logo size="sm" />
            <span className="font-black text-lg">FuelWatch PH</span>
          </div>

          <h2 className="text-4xl font-black tracking-tight mb-2">Create account.</h2>
          <p className="text-gray-600 font-bold text-sm mb-10">Join the community and start saving on fuel.</p>

          <form onSubmit={handleSignUp} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3">Full Name</label>
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Juan Dela Cruz"
                  className={`${inputClass} pl-12`}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3">Email</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className={`${inputClass} pl-12`}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3">Password</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className={`${inputClass} pl-12 pr-12`}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <p className="text-[10px] font-bold text-gray-700">
              By signing up, you agree to our{" "}
              <button type="button" onClick={() => navigate("/app/terms")} className="text-emerald-600 hover:text-emerald-400 transition-colors">
                Terms & Privacy Policy
              </button>
              .
            </p>

            {formError && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-sm font-bold text-rose-400">
                {formError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <div className="mt-8 space-y-4 text-center">
            <button
              onClick={() => navigate("/app/map")}
              className="text-gray-600 hover:text-gray-400 font-bold text-sm transition-colors"
            >
              Continue as Guest
            </button>
            <div className="text-xs font-bold text-gray-700">
              Already have an account?{" "}
              <button onClick={() => navigate("/login")} className="text-emerald-500 hover:text-emerald-400 transition-colors">
                Sign In
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}