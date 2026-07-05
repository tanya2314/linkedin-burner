import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { Flame, Mail, Lock, ShieldAlert, Sparkles, ArrowRight, Info } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data: { session } }: any) => {
      if (session) {
        navigate('/', { replace: true });
      }
    });
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured) {
      setErrorMsg('Supabase is not configured yet. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.');
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        // If auto-confirm is disabled, user might need to confirm email
        if (data.user && data.session === null) {
          setSuccessMsg('Signup successful! Check your email for confirmation link.');
        } else if (data.session) {
          navigate('/', { replace: true });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoBypass = () => {
    // If not configured, we just navigate to dashboard with demo state
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-accent-roast/20 rounded-full blur-[100px] animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-purple/15 rounded-full blur-[120px] animate-pulse-slow pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Logo & Name */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-accent-roast to-accent-purple rounded-2xl shadow-lg shadow-accent-roast/20 mb-4 animate-bounce">
            <Flame className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-accent-roast via-pink-500 to-accent-purple bg-clip-text text-transparent">
            LinkedIn Burner
          </h1>
          <p className="text-slate-400 mt-2 text-sm font-medium">
            AI-powered roasts and polished rewrites for your feed.
          </p>
        </div>

        {/* Configuration Notice */}
        {!isSupabaseConfigured && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex gap-3 text-amber-200 text-xs leading-relaxed">
            <Info className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <span className="font-bold block mb-1">Supabase Keys Missing</span>
              To enable signups, database storage, and history logs, please add your Supabase credentials to a <code className="bg-dark-950 px-1 py-0.5 rounded text-amber-300">.env</code> file.
              <button
                onClick={handleDemoBypass}
                className="mt-3 flex items-center gap-1.5 font-semibold text-amber-400 hover:text-amber-300 transition-colors uppercase tracking-wider text-[10px]"
              >
                Bypass login (Demo Mode) <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Auth Card */}
        <div className="glow-card rounded-2xl p-8 backdrop-blur-xl bg-dark-900/60 border border-slate-800 shadow-2xl">
          <h2 className="text-2xl font-bold mb-6 text-slate-100 flex items-center gap-2">
            {isSignUp ? (
              <>
                <Sparkles className="w-5 h-5 text-accent-purple" /> Create Account
              </>
            ) : (
              <>
                Welcome Back
              </>
            )}
          </h2>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5 text-rose-300 text-xs">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-dark-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-accent-purple focus:ring-1 focus:ring-accent-purple transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-dark-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-accent-purple focus:ring-1 focus:ring-accent-purple transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-gradient-to-r from-accent-roast to-accent-purple text-white font-semibold rounded-lg text-sm hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-accent-roast/10"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : isSignUp ? (
                'Sign Up'
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Toggle login/signup mode */}
          <div className="mt-6 text-center text-xs">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="text-slate-400 hover:text-white transition-colors"
            >
              {isSignUp ? (
                <>
                  Already have an account? <span className="text-accent-purple font-semibold">Sign in</span>
                </>
              ) : (
                <>
                  Don't have an account? <span className="text-accent-roast font-semibold">Create one</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Demo Mode trigger when Supabase is configured but user just wants quick access */}
        {isSupabaseConfigured && (
          <div className="mt-4 text-center">
            <button
              onClick={handleDemoBypass}
              className="text-slate-500 hover:text-slate-400 text-xs transition-colors"
            >
              Demo mode bypass (no login check)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
