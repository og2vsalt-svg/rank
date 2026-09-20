import { useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useRouter } from './Router';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, isLoggedIn, logout } = useAuth();
  const { navigate } = useRouter();
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <nav className="fixed top-0 inset-x-0 z-50 glass">
      <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
        <button onClick={() => navigate('home')} className="text-lg font-semibold tracking-tight text-white">
          rank<span className="text-[#0a84ff]">vault</span>
        </button>

        <div className="hidden md:flex items-center gap-6">
          <button onClick={() => navigate('vault')} className="text-[13px] text-neutral-400 hover:text-white transition-colors">Vault</button>
          <a href="#features" className="text-[13px] text-neutral-400 hover:text-white transition-colors">Features</a>
          <a href="#faq" className="text-[13px] text-neutral-400 hover:text-white transition-colors">FAQ</a>
        </div>

        <div className="flex items-center gap-1.5">
          {isLoggedIn ? (
            <div className="relative" ref={userMenuRef}>
              <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 p-1.5 rounded-full hover:bg-white/5 transition-colors">
                <div className="w-7 h-7 rounded-full bg-[#0a84ff]/15 border border-[#0a84ff]/25 flex items-center justify-center">
                  <span className="text-xs font-bold text-[#0a84ff]">{user!.username.charAt(0).toUpperCase()}</span>
                </div>
                <span className="hidden sm:inline text-sm text-neutral-300 max-w-[100px] truncate">{user!.username}</span>
              </button>
              <div className={`absolute right-0 top-full mt-1 w-52 rounded-2xl glass overflow-hidden transition-all duration-200 origin-top-right ${userMenuOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                <div className="px-4 py-3 border-b border-white/5">
                  <p className="text-sm font-medium text-white truncate">{user!.username}</p>
                  <p className="text-xs text-neutral-500 truncate">{user!.email}</p>
                </div>
                <button onClick={() => { setUserMenuOpen(false); navigate('vault'); }} className="w-full text-left px-4 py-2.5 text-sm text-neutral-300 hover:bg-white/5">Open vault</button>
                <button onClick={() => { logout(); setUserMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-neutral-400 hover:text-red-400 hover:bg-white/5">Log out</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button onClick={() => navigate('login')} className="text-[13px] text-neutral-400 hover:text-white px-3 py-1.5 rounded-full transition-colors">Log in</button>
              <button onClick={() => navigate('signup')} className="hidden sm:inline-flex text-[13px] font-medium px-3.5 py-1.5 rounded-full bg-white text-black hover:bg-neutral-200 transition-colors">Sign up</button>
            </div>
          )}

          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-neutral-400 hover:text-white p-1 ml-1" aria-label="Menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>
          </button>
        </div>
      </div>

      <div className={`md:hidden border-t border-white/5 overflow-hidden transition-all duration-300 ease-out ${menuOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-5 py-4 space-y-2">
          <button onClick={() => { setMenuOpen(false); navigate('vault'); }} className="block text-sm text-neutral-400 hover:text-white py-1.5">Vault</button>
          <a href="#features" onClick={() => setMenuOpen(false)} className="block text-sm text-neutral-400 hover:text-white py-1.5">Features</a>
          <a href="#faq" onClick={() => setMenuOpen(false)} className="block text-sm text-neutral-400 hover:text-white py-1.5">FAQ</a>
        </div>
      </div>
    </nav>
  );
}
