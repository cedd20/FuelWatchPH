import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Zap, ShieldCheck, TrendingDown } from "lucide-react";
import { Logo } from "@/shared/components/Logo";
import { useAuth } from "@/app/providers/AuthContext";
import {
  clearStoredRememberedCredentials,
  getStoredRememberedCredentials,
  setStoredRememberedCredentials,
  setStoredRememberMePreference,
} from "@/shared/utils/authSession";
import { toast } from "sonner";

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
      toast.success("Welcome back!");
      const isAdminUser = result?.user?.role === 'admin' || result?.user?.user_type === 0;
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

  const inputClass = "w-full bg-[#0C1A17] border border-emerald-500/10 rounded-2xl p-5 text-sm font-bold text-white placeholder:text-gray-700 focus:border-emerald-500/50 focus:outline-none transition-all";

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
            Track fuel prices<br /><span className="text-emerald-400">smarter.</span>
          </h1>
          <p className="text-gray-500 font-bold leading-relaxed max-w-sm">
            Compare prices, find the cheapest stations nearby, and help the community with verified updates.
          </p>

          <div className="mt-12 space-y-4">
            {[
              { icon: TrendingDown, label: "Real-time price comparisons" },
              { icon: ShieldCheck, label: "Community-verified accuracy" },
              { icon: Zap, label: "Earn Karma for contributions" },
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

          <h2 className="text-4xl font-black tracking-tight mb-2">Welcome back.</h2>
          <p className="text-gray-600 font-bold text-sm mb-10">Sign in to your account to continue.</p>

          <form onSubmit={handleLogin} className="space-y-5">
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
                  placeholder="Enter your password"
                  className={`${inputClass} pl-12 pr-12`}
                  required
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

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() => handleRememberMeChange(!rememberMe)}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer ${
                    rememberMe ? "bg-emerald-500 border-emerald-400" : "border-gray-700 bg-[#0C1A17]"
                  }`}
                >
                  {rememberMe && <ShieldCheck className="w-3 h-3 text-white" strokeWidth={3} />}
                </div>
                <span className="text-xs font-bold text-gray-500">Remember Me</span>
              </label>
              <button type="button" className="text-xs font-black text-emerald-500 hover:text-emerald-400 transition-colors">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>

            <p className="text-center text-[10px] font-bold text-gray-700">
              Only use Remember Me on your personal device.
            </p>
          </form>

          <div className="mt-8 space-y-4 text-center">
            <button
              onClick={() => navigate("/app/map")}
              className="text-gray-600 hover:text-gray-400 font-bold text-sm transition-colors"
            >
              Continue as Guest
            </button>
            <div className="text-xs font-bold text-gray-700">
              Don't have an account?{" "}
              <button onClick={() => navigate("/signup")} className="text-emerald-500 hover:text-emerald-400 transition-colors">
                Sign Up Free
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
