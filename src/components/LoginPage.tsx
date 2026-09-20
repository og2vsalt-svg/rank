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
    setTimeout(() => {
      const result = login(email, password);
      setLoading(false);
      if (result.ok) navigate('home');
      else setError(result.error || 'Something went wrong');
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center px-5 py-20 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#0a84ff]/[0.06] rounded-full blur-[100px] pointer-events-none" />
      <div className="relative w-full max-w-sm">
        <button onClick={() => navigate('home')} className="block mx-auto mb-8 text-center">
          <span className="text-xl font-bold tracking-tight text-white">
            rank<span className="text-[#0a84ff]">vault</span>
          </span>
        </button>
        <div className="glass rounded-xl p-6">
          <h1 className="text-xl font-bold text-white mb-1">Log in</h1>
          <p className="text-sm text-neutral-500 mb-6">welcome back. this is just the vault.</p>
          {error && (
            <div className="mb-4 p-3 rounded-lg border border-red-500/20 bg-red-500/[0.05] text-red-400 text-sm">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" required autoComplete="email" className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-white/5 text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-[#0a84ff]/40 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required autoComplete="current-password" className="w-full px-3 py-2.5 pr-10 rounded-lg border border-white/10 bg-white/5 text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-[#0a84ff]/40 transition-colors" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300">show</button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-2.5 rounded-full bg-white text-black font-semibold text-sm hover:bg-neutral-200 disabled:opacity-50">{loading ? 'Signing in...' : 'Sign in'}</button>
          </form>
        </div>
        <p className="text-center text-sm text-neutral-500 mt-5">
          No account?{' '}
          <button onClick={() => navigate('signup')} className="text-[#0a84ff] hover:text-white font-medium">Sign up</button>
        </p>
      </div>
    </div>
  );
}
