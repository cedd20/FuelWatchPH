import React, { useState, useEffect } from 'react';
import { Fuel, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '@/app/providers/AuthProvider';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();

  useEffect(() => {
    document.title = 'Login | FuelWatchPH';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signIn(email);
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-4 sm:p-6">
      <div className="w-full max-w-[420px] bg-[#0f172a]/40 p-8 sm:p-10 rounded-[2.5rem] border border-slate-800 shadow-2xl backdrop-blur-2xl flex flex-col items-center">
        {/* Branding Section */}
        <div className="flex flex-col items-center space-y-3 mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-3.5 rounded-2xl shadow-lg shadow-blue-500/20">
            <Fuel className="w-8 h-8 text-white" />
          </div>
          <div className="text-center">
             <h1 className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white to-blue-400">
              FuelWatchPH
            </h1>
            <p className="text-slate-500 font-bold tracking-[0.3em] uppercase text-[7px] mt-0.5">
               Community Powered
            </p>
          </div>
        </div>

        {/* Welcome Text */}
        <div className="w-full space-y-1 text-center mb-8">
          <h2 className="text-xl font-bold text-white tracking-tight">Welcome Back</h2>
          <p className="text-slate-500 font-medium text-xs leading-relaxed">Enter your credentials to access your dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-5">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors">
                <Mail className="w-4 h-4" />
              </div>
              <input 
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-[#1e293b]/30 border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm text-white placeholder:text-slate-600"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
              <button type="button" className="text-[10px] font-bold text-blue-500 hover:text-blue-400 transition-colors uppercase tracking-tight">Forgot?</button>
            </div>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors">
                <Lock className="w-4 h-4" />
              </div>
              <input 
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-[#1e293b]/30 border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm text-white placeholder:text-slate-600"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group text-sm"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                Sign In
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-[11px] text-slate-500 mt-8">
          Don't have an account? <button type="button" className="font-bold text-blue-500 hover:text-blue-400 transition-colors">Sign up now</button>
        </p>
      </div>
    </div>
  );
}
