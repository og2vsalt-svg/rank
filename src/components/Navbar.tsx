import { useState, useRef, useEffect } from 'react';
import { useCart } from './CartContext';
import { useAuth } from './AuthContext';
import { useRouter } from './Router';

const DISCORD = 'https://discord.gg/jfDBYWq6Ax';

const links = [
  { label: 'Pricing', href: '#ranks' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'FAQ', href: '#faq' },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { count, setOpen: setCartOpen } = useCart();
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

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 inset-x-0 z-50 glass-strong border-b-0">
      <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
        <button onClick={() => navigate('home')} className="text-lg font-bold tracking-tight text-white">
          rank<span className="text-green-400">boosts</span>
        </button>

        <div className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[13px] text-neutral-500 hover:text-white transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Cart */}
          <button
            onClick={() => setCartOpen(true)}
            className="relative p-2 text-neutral-400 hover:text-white transition-colors"
            aria-label="Cart"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-green-500 text-black text-[10px] font-bold flex items-center justify-center leading-none px-1">
                {count}
              </span>
            )}
          </button>

          {/* Auth */}
          {isLoggedIn ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-green-500/15 border border-green-500/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-green-400">
                    {user!.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="hidden sm:inline text-sm text-neutral-300 max-w-[100px] truncate">
                  {user!.username}
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`text-neutral-500 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {/* Dropdown */}
              <div className={`absolute right-0 top-full mt-1 w-52 rounded-xl glass-strong overflow-hidden transition-all duration-200 origin-top-right ${
                userMenuOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
              }`}>
                <div className="px-4 py-3 border-b border-white/5">
                  <p className="text-sm font-medium text-white truncate">{user!.username}</p>
                  <p className="text-xs text-neutral-500 truncate">{user!.email}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-neutral-400 hover:text-red-400 hover:bg-white/5 transition-colors"
                  >
                    Log out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => navigate('login')}
                className="text-[13px] text-neutral-400 hover:text-white px-3 py-1.5 rounded transition-colors"
              >
                Log in
              </button>
              <button
                onClick={() => navigate('signup')}
                className="hidden sm:inline-flex text-[13px] font-medium px-3.5 py-1.5 rounded bg-green-500 text-black hover:bg-green-400 transition-colors"
              >
                Sign up
              </button>
            </div>
          )}

          {/* Discord */}
          <a
            href={DISCORD}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:inline-flex text-[13px] font-medium px-4 py-1.5 rounded border border-white/10 text-neutral-300 hover:text-white hover:border-white/20 transition-colors ml-1"
          >
            Discord
          </a>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-neutral-400 hover:text-white p-1 ml-1"
            aria-label="Menu"
          >
            {menuOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden border-t border-white/5 overflow-hidden transition-all duration-300 ease-out ${
          menuOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-5 py-4 space-y-2">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="block text-sm text-neutral-400 hover:text-white transition-colors py-1.5"
            >
              {l.label}
            </a>
          ))}
          <div className="border-t border-white/5 pt-3 mt-2 space-y-2">
            {!isLoggedIn && (
              <>
                <button
                  onClick={() => { setMenuOpen(false); navigate('login'); }}
                  className="block w-full text-left text-sm text-neutral-400 hover:text-white transition-colors py-1.5"
                >
                  Log in
                </button>
                <button
                  onClick={() => { setMenuOpen(false); navigate('signup'); }}
                  className="block w-full text-center text-sm font-medium px-4 py-2 rounded bg-green-500 text-black hover:bg-green-400 transition-colors"
                >
                  Sign up
                </button>
              </>
            )}
            <a
              href={DISCORD}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenuOpen(false)}
              className="block w-full text-center text-sm font-medium px-4 py-2 rounded border border-white/10 text-neutral-300 hover:text-white hover:border-white/20 transition-colors"
            >
              Discord
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
