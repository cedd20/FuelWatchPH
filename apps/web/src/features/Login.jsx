import { useState } from "react";
import { useNavigate } from "react-router";
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Button } from "@/shared/components/Button";
import { Logo } from "@/shared/components/Logo";
import { useAuth } from "@/app/providers/AuthContext";
import { toast } from "sonner";

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate("/app/map");
    } catch (error) {
      toast.error("Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueAsGuest = () => {
    navigate("/app/map");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-950 dark:to-neutral-900 flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 pt-12 pb-8 px-6 relative overflow-hidden">
        {/* Enhanced radial glow background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-teal-400/10 rounded-full blur-2xl" />

        <div className="relative z-10">
          <button
            onClick={() => navigate(-1)}
            className="text-white mb-4 flex items-center gap-2 font-bold drop-shadow-lg hover:gap-3 transition-all"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-3 mb-4">
            <Logo size="md" className="drop-shadow-2xl" />
            <h1 className="text-3xl font-bold text-white drop-shadow-2xl tracking-tight">FuelWatch PH</h1>
          </div>
          <p className="text-white/95 font-medium drop-shadow-lg">Welcome back! Sign in to continue</p>
        </div>
      </div>

      {/* Desktop Left Panel - Branding */}
      <div className="hidden lg:flex lg:flex-col lg:justify-center lg:w-1/2 lg:min-h-screen bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 relative overflow-hidden p-12">
        {/* Enhanced radial glow background */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-teal-400/10 rounded-full blur-2xl" />

        {/* Abstract decorative elements */}
        <div className="absolute top-20 right-20 w-32 h-32 border-4 border-white/20 rounded-3xl rotate-12" />
        <div className="absolute bottom-32 left-16 w-24 h-24 border-4 border-white/15 rounded-2xl -rotate-12" />

        <div className="relative z-10 max-w-xl">
          <div className="mb-8">
            <Logo size="lg" className="drop-shadow-2xl mb-6" />
            <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-2xl tracking-tight leading-tight">
              Track fuel prices smarter.
            </h1>
            <p className="text-xl text-white/95 font-medium drop-shadow-lg leading-relaxed">
              FuelWatch PH helps you compare fuel prices, find nearby stations, and contribute verified fuel updates to help the community save.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-white/90">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="font-semibold">Real-time fuel price updates</span>
            </div>
            <div className="flex items-center gap-3 text-white/90">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="font-semibold">Find the cheapest stations nearby</span>
            </div>
            <div className="flex items-center gap-3 text-white/90">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="font-semibold">Community-driven price verification</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 px-6 py-8 lg:w-1/2 lg:min-h-screen lg:flex lg:flex-col lg:justify-center lg:px-16 lg:py-12">
        {/* Desktop Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="hidden lg:flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold mb-8 transition-all hover:gap-3"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
          <span>Back</span>
        </button>

        <div className="max-w-lg mx-auto lg:max-w-md lg:w-full">
          {/* Desktop Header */}
          <div className="hidden lg:block mb-8">
            <h2 className="text-4xl font-bold text-foreground mb-3 tracking-tight">Welcome Back</h2>
            <p className="text-lg text-muted-foreground font-medium">Sign in to continue using FuelWatch PH</p>
          </div>
        <form onSubmit={handleLogin} className="space-y-5 lg:space-y-6 mb-6 lg:mb-8">
          <div>
            <label className="block text-sm lg:text-base font-bold text-foreground mb-2 lg:mb-3">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 lg:left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full pl-11 lg:pl-12 pr-4 lg:pr-5 py-3.5 lg:py-4 bg-white dark:bg-neutral-900 rounded-xl lg:rounded-2xl border-2 border-gray-200 dark:border-neutral-700 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 shadow-lg text-foreground font-medium transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm lg:text-base font-bold text-foreground mb-2 lg:mb-3">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 lg:left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-11 lg:pl-12 pr-11 lg:pr-12 py-3.5 lg:py-4 bg-white dark:bg-neutral-900 rounded-xl lg:rounded-2xl border-2 border-gray-200 dark:border-neutral-700 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 shadow-lg text-foreground font-medium transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 lg:right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="button"
            className="text-sm lg:text-base text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
          >
            Forgot password?
          </button>

          <Button type="submit" fullWidth disabled={isLoading}>
            {isLoading ? "Signing In..." : "Sign In"}
          </Button>
        </form>

        {/* Continue as Guest */}
        <div className="text-center mb-6 lg:mb-8">
          <button
            onClick={handleContinueAsGuest}
            className="text-muted-foreground text-sm lg:text-base hover:text-foreground font-medium transition-colors"
          >
            Continue as Guest
          </button>
        </div>

        {/* Sign Up Link */}
        <div className="text-center">
          <span className="text-muted-foreground text-sm lg:text-base">Don't have an account? </span>
          <button
            onClick={() => navigate("/signup")}
            className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline text-sm lg:text-base"
          >
            Sign Up
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
