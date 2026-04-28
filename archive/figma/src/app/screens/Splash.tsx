import { useEffect } from "react";
import { useNavigate } from "react-router";
import { Logo } from "../components/Logo";

export function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/app/map");
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="h-screen bg-gradient-to-br from-emerald-600 via-emerald-800 to-teal-900 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Radial Center Glow - Behind Logo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-400/20 rounded-full blur-3xl" />

      {/* Secondary Glow Layer */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-teal-300/15 rounded-full blur-2xl" />

      {/* Subtle Top Highlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-300/10 rounded-full blur-3xl" />

      {/* Subtle Vignette */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at center, transparent 0%, transparent 50%, rgba(0,0,0,0.2) 100%)' }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo Container with Glass Effect */}
        <div className="relative mb-8">
          {/* Outer Glow */}
          <div className="absolute inset-0 -m-8 bg-gradient-to-br from-emerald-400/30 to-teal-400/30 rounded-full blur-2xl" />

          {/* Glass Circle Container */}
          <div className="relative bg-white/10 backdrop-blur-md rounded-full p-8 border border-white/20 shadow-2xl">
            {/* Inner Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-full" />

            {/* Logo with enhanced shadow */}
            <div className="relative">
              <Logo size="lg" className="drop-shadow-2xl relative z-10" />

              {/* Logo Radial Highlight */}
              <div className="absolute inset-0 -m-4 rounded-full blur-xl" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)' }} />
            </div>
          </div>
        </div>

        {/* App Name - Enhanced */}
        <h1 className="text-4xl font-bold text-white mb-4 drop-shadow-2xl tracking-tight">
          FuelWatch PH
        </h1>

        {/* Tagline - Refined */}
        <p className="text-white/85 text-base font-medium drop-shadow-lg tracking-wide">
          Find the best fuel prices nearby
        </p>
      </div>
    </div>
  );
}
