import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { ArrowLeft, Eye, EyeOff, Lock, Mail, Shield } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/app/providers/AuthContext";
import { Button } from "@/shared/components/Button";
import { Logo } from "@/shared/components/Logo";

export function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { adminLogin, isAdminAuthenticated } = useAuth();
  const [email, setEmail] = useState("admin@fuelwatch.ph");
  const [password, setPassword] = useState("Admin1234!");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const returnTo = location.state?.returnTo || "/admin/dashboard";

  useEffect(() => {
    if (isAdminAuthenticated) {
      navigate(returnTo, { replace: true });
    }
  }, [isAdminAuthenticated, navigate, returnTo]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await adminLogin(email, password, { rememberMe });
      toast.success("Admin access granted.");
      navigate(returnTo, { replace: true });
    } catch (error) {
      toast.error(error.message || "Unable to sign in as admin.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-950 dark:to-neutral-900 flex flex-col lg:flex-row">
      <div className="lg:hidden bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 pt-12 pb-8 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-teal-400/10 rounded-full blur-2xl" />

        <div className="relative z-10">
          <button
            onClick={() => navigate("/login")}
            className="text-white mb-4 flex items-center gap-2 font-bold drop-shadow-lg hover:gap-3 transition-all"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
            <span>Back to User Sign In</span>
          </button>
          <div className="flex items-center gap-3 mb-4">
            <Logo size="md" className="drop-shadow-2xl" />
            <h1 className="text-3xl font-bold text-white drop-shadow-2xl tracking-tight">Admin Sign In</h1>
          </div>
          <p className="text-white/95 font-medium drop-shadow-lg">Access the FuelWatch PH admin dashboard</p>
        </div>
      </div>

      <div className="hidden lg:flex lg:flex-col lg:justify-center lg:w-1/2 lg:min-h-screen bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 relative overflow-hidden p-12">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-teal-400/10 rounded-full blur-2xl" />
        <div className="absolute top-20 right-20 w-32 h-32 border-4 border-white/20 rounded-3xl rotate-12" />
        <div className="absolute bottom-32 left-16 w-24 h-24 border-4 border-white/15 rounded-2xl -rotate-12" />

        <div className="relative z-10 max-w-xl">
          <div className="mb-8">
            <Logo size="lg" className="drop-shadow-2xl mb-6" />
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-md border border-white/20 mb-6">
              <Shield className="w-4 h-4 text-white" strokeWidth={2.5} />
              <span className="text-sm font-bold text-white">Admin Portal</span>
            </div>
            <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-2xl tracking-tight leading-tight">
              Manage FuelWatch PH with confidence.
            </h1>
            <p className="text-xl text-white/95 font-medium drop-shadow-lg leading-relaxed">
              Review verification requests, resolve reports, and keep the platform trusted with the same streamlined experience.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-white/90">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5" strokeWidth={2.5} />
              </div>
              <span className="font-semibold">Moderate verification and trust workflows</span>
            </div>
            <div className="flex items-center gap-3 text-white/90">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                <Mail className="w-5 h-5" strokeWidth={2.5} />
              </div>
              <span className="font-semibold">Monitor user and station issues in one place</span>
            </div>
            <div className="flex items-center gap-3 text-white/90">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                <Lock className="w-5 h-5" strokeWidth={2.5} />
              </div>
              <span className="font-semibold">Ready for backend-backed role authentication later</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 py-8 lg:w-1/2 lg:min-h-screen lg:flex lg:flex-col lg:justify-center lg:px-16 lg:py-12">
        <button
          onClick={() => navigate("/login")}
          className="hidden lg:flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold mb-8 transition-all hover:gap-3"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
          <span>Back to User Sign In</span>
        </button>

        <div className="max-w-lg mx-auto lg:max-w-md lg:w-full">
          <div className="hidden lg:block mb-8">
            <h2 className="text-4xl font-bold text-foreground mb-3 tracking-tight">Admin Sign In</h2>
            <p className="text-lg text-muted-foreground font-medium">Access the FuelWatch PH admin dashboard</p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-5 lg:space-y-6 mb-6 lg:mb-8">
            <div>
              <label className="block text-sm lg:text-base font-bold text-foreground mb-2 lg:mb-3">Admin Email</label>
              <div className="relative">
                <Mail className="absolute left-3 lg:left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@fuelwatch.ph"
                  className="w-full pl-11 lg:pl-12 pr-4 lg:pr-5 py-3.5 lg:py-4 bg-white dark:bg-neutral-900 rounded-xl lg:rounded-2xl border-2 border-gray-200 dark:border-neutral-700 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 shadow-lg text-foreground font-medium transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm lg:text-base font-bold text-foreground mb-2 lg:mb-3">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 lg:left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your admin password"
                  className="w-full pl-11 lg:pl-12 pr-11 lg:pr-12 py-3.5 lg:py-4 bg-white dark:bg-neutral-900 rounded-xl lg:rounded-2xl border-2 border-gray-200 dark:border-neutral-700 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 shadow-lg text-foreground font-medium transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 lg:right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <label className="inline-flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm lg:text-base font-semibold text-foreground">Remember Me</span>
              </label>

              <div className="text-xs lg:text-sm text-right text-muted-foreground font-medium">
                Mock admin credentials are prefilled for testing.
              </div>
            </div>

            <Button type="submit" fullWidth disabled={isLoading}>
              {isLoading ? "Signing In..." : "Sign In as Admin"}
            </Button>

            <p className="text-xs lg:text-sm text-muted-foreground text-center">
              Frontend-only placeholder login. Replace with backend role authentication when ready.
            </p>
          </form>

          <div className="text-center">
            <span className="text-muted-foreground text-sm lg:text-base">Looking for the regular app? </span>
            <button
              onClick={() => navigate("/login")}
              className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline text-sm lg:text-base"
            >
              Back to User Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
