import { useState, type FormEvent } from 'react';
import { useAuth } from './AuthContext';
import { useRouter } from './Router';

export default function LoginPage() {
  const { login } = useAuth();
  const { navigate } = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // small delay to feel real
    setTimeout(() => {
      const result = login(email, password);
      setLoading(false);
      if (result.ok) {
        navigate('home');
      } else {
        setError(result.error || 'Something went wrong');
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center px-5 py-20 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-green-500/[0.03] rounded-full blur-[100px] pointer-events-none" />
      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <button onClick={() => navigate('home')} className="block mx-auto mb-8 text-center">
          <span className="text-xl font-bold tracking-tight text-white">
            rank<span className="text-green-400">boosts</span>
          </span>
        </button>

        <div className="glass rounded-xl p-6">
          <h1 className="text-xl font-bold text-white mb-1">Log in</h1>
          <p className="text-sm text-neutral-500 mb-6">Welcome back. Sign in to your account.</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg border border-red-500/20 bg-red-500/[0.05] text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                required
                autoComplete="email"
                className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-white/5 text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-green-500/30 focus:ring-1 focus:ring-green-500/10 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="w-full px-3 py-2.5 pr-10 rounded-lg border border-white/10 bg-white/5 text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-green-500/30 focus:ring-1 focus:ring-green-500/10 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  {showPw ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-green-500 text-black font-semibold text-sm hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-neutral-500 mt-5">
          No account?{' '}
          <button
            onClick={() => navigate('signup')}
            className="text-green-400 hover:text-green-300 font-medium transition-colors"
          >
            Sign up
          </button>
        </p>

        <button
          onClick={() => navigate('home')}
          className="block mx-auto mt-4 text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
        >
          Back to site
        </button>
      </div>
    </div>
  );
}
