import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { AlertTriangle, ArrowRight, LineChart, Home } from 'lucide-react';
import { auth, googleProvider } from '../firebase/config';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailLogin = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to login. Check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithPopup(auth, googleProvider);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || 'Google login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080b] text-zinc-100 flex items-center justify-center px-6 py-16">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/3 h-96 w-96 bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/3 right-1/4 h-96 w-96 bg-indigo-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-8 shadow-2xl shadow-black/30">
        <Link to="/" className="absolute top-6 right-6 p-2 rounded-lg hover:bg-white/5 transition-colors group">
          <Home size={18} className="text-zinc-400 group-hover:text-white transition-colors" />
        </Link>
        
        <div className="mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <LineChart size={18} className="text-white" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">FinSight AI</p>
            <h1 className="text-xl font-bold text-zinc-100">Login</h1>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleEmailLogin}>
          <div>
            <label htmlFor="email" className="mb-1 block text-xs uppercase tracking-[0.2em] text-zinc-500">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#0f1117] px-4 py-3 text-zinc-100 placeholder:text-zinc-500 outline-none transition-colors focus:border-blue-500/60"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-xs uppercase tracking-[0.2em] text-zinc-500">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#0f1117] px-4 py-3 text-zinc-100 placeholder:text-zinc-500 outline-none transition-colors focus:border-blue-500/60"
              placeholder="Enter password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign in with Email'}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-zinc-500">
          <div className="h-px flex-1 bg-white/10" />
          <span>or</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full rounded-xl border border-white/15 bg-white/[0.02] px-4 py-3 font-medium text-zinc-200 transition-colors hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Continue with Google
        </button>

        <p className="mt-6 text-sm text-zinc-400">
          New to FinSight?{' '}
          <Link to="/signup" className="font-semibold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1">
            Create account
            <ArrowRight size={14} />
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
