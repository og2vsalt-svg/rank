import { useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useRouter, type Route } from './Router';

type NavItem = { to: Route; label: string };

const primary: NavItem[] = [
  { to: 'vault', label: 'vault' },
  { to: 'drop', label: 'drop' },
  { to: 'harvest', label: 'harvest' },
  { to: 'sundial', label: 'sundial' },
  { to: 'tarn', label: 'tarn' },
  { to: 'weir', label: 'weir' },
  { to: 'ketch', label: 'ketch' },
  { to: 'ledger', label: 'ledger' },
];

const groups: { title: string; items: NavItem[] }[] = [
  {
    title: 'files',
    items: [
      { to: 'vault', label: 'vault' },
      { to: 'drop', label: 'drop' },
      { to: 'harvest', label: 'harvest' },
      { to: 'harbor', label: 'harbor' },
      { to: 'gauge', label: 'gauge' },
      { to: 'stills', label: 'stills' },
      { to: 'flint', label: 'flint' },
      { to: 'kiln', label: 'kiln' },
      { to: 'furrow', label: 'furrow' },
      { to: 'weir', label: 'weir' },
      { to: 'ketch', label: 'ketch' },
      { to: 'skiff', label: 'skiff' },
      { to: 'jetty', label: 'jetty' },
      { to: 'folio', label: 'folio' },
      { to: 'keepsake', label: 'keepsake' },
      { to: 'oriel', label: 'oriel' },
      { to: 'nimbus', label: 'nimbus' },
    ],
  },
  {
    title: 'share',
    items: [
      { to: 'sieve', label: 'sieve' },
      { to: 'lodestone', label: 'lodestone' },
      { to: 'ledger', label: 'ledger' },
      { to: 'tarn', label: 'tarn' },
      { to: 'foyer', label: 'foyer' },
      { to: 'cloister', label: 'cloister' },
      { to: 'lumen', label: 'lumen' },
      { to: 'meadow', label: 'meadow' },
      { to: 'moss', label: 'moss' },
      { to: 'gilt', label: 'gilt' },
      { to: 'inlet', label: 'inlet' },
      { to: 'quay', label: 'quay' },
      { to: 'loom', label: 'loom' },
      { to: 'wicket', label: 'wicket' },
      { to: 'scrip', label: 'scrip' },
    ],
  },
  {
    title: 'create',
    items: [
      { to: 'sundial', label: 'sundial' },
      { to: 'meadow', label: 'meadow' },
      { to: 'lumen', label: 'lumen' },
      { to: 'quill', label: 'quill' },
      { to: 'notes', label: 'notes' },
      { to: 'paste', label: 'paste' },
      { to: 'prism', label: 'prism' },
      { to: 'loom', label: 'loom' },
      { to: 'wick', label: 'wick' },
      { to: 'scrip', label: 'scrip' },
      { to: 'ketch', label: 'ketch' },
    ],
  },
  {
    title: 'tools',
    items: [
      { to: 'flint', label: 'flint' },
      { to: 'gauge', label: 'gauge' },
      { to: 'kiln', label: 'kiln' },
      { to: 'tarn', label: 'tarn' },
      { to: 'weir', label: 'weir' },
      { to: 'hash', label: 'hash' },
      { to: 'convert', label: 'convert' },
      { to: 'qr', label: 'qr' },
      { to: 'diff', label: 'diff' },
      { to: 'nacre', label: 'nacre' },
      { to: 'lintel', label: 'lintel' },
    ],
  },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>('files');
  const { user, isLoggedIn, logout } = useAuth();
  const { navigate } = useRouter();
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [menuOpen]);

  const go = (to: Route) => {
    setMenuOpen(false);
    navigate(to);
  };

  return (
    <nav className="fixed top-0 inset-x-0 z-50 glass">
      <div className="max-w-6xl mx-auto px-4 sm:px-5 h-14 flex items-center justify-between gap-3">
        <button onClick={() => navigate('home')} className="text-lg font-semibold tracking-tight text-white shrink-0">
          rank<span className="text-[#0a84ff]">vault</span>
        </button>
        <div className="hidden lg:flex items-center gap-1 min-w-0">
          {primary.slice(0, 8).map((l) => (
            <button key={l.to} onClick={() => navigate(l.to)} className="text-[13px] text-neutral-400 hover:text-white px-2.5 py-1.5 rounded-full hover:bg-white/5 transition-colors">{l.label}</button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isLoggedIn ? (
            <div className="relative" ref={userMenuRef}>
              <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 p-1.5 rounded-full hover:bg-white/5 transition-colors">
                <div className="w-7 h-7 rounded-full bg-[#0a84ff]/15 border border-[#0a84ff]/25 flex items-center justify-center">
                  <span className="text-xs font-bold text-[#0a84ff]">{user!.username.charAt(0).toUpperCase()}</span>
                </div>
              </button>
              <div className={`absolute right-0 top-full mt-1 w-52 rounded-2xl glass overflow-hidden transition-all duration-200 origin-top-right ${userMenuOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                <div className="px-4 py-3 border-b border-white/5">
                  <p className="text-sm font-medium text-white truncate">{user!.username}</p>
                </div>
                <button onClick={() => { setUserMenuOpen(false); navigate('vault'); }} className="w-full text-left px-4 py-3 text-sm text-neutral-300 hover:bg-white/5">open vault</button>
                <button onClick={() => { logout(); setUserMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-neutral-400 hover:text-red-400 hover:bg-white/5">log out</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <button onClick={() => navigate('login')} className="text-[13px] text-neutral-400 hover:text-white px-2.5 py-1.5 rounded-full">log in</button>
              <button onClick={() => navigate('signup')} className="hidden sm:inline-flex text-[13px] font-medium px-3.5 py-1.5 rounded-full bg-white text-black hover:bg-neutral-200">sign up</button>
            </div>
          )}
          <button onClick={() => setMenuOpen(!menuOpen)} className="text-neutral-400 hover:text-white p-1.5 rounded-full hover:bg-white/5" aria-label="menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></svg>
          </button>
        </div>
      </div>
      <div className={`border-t border-white/5 overflow-hidden transition-all duration-300 ease-out ${menuOpen ? 'max-h-[min(75vh,620px)] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="max-h-[min(75vh,620px)] overflow-y-auto px-4 sm:px-5 py-3">
          <div className="flex gap-2 overflow-x-auto pb-3 mb-1">
            {primary.map((l) => (
              <button key={`chip-${l.to}`} onClick={() => go(l.to)} className="shrink-0 px-3.5 py-1.5 rounded-full bg-white/8 border border-white/10 text-[13px] text-neutral-200">{l.label}</button>
            ))}
          </div>
          <div className="space-y-1.5">
            {groups.map((g) => {
              const open = openGroup === g.title;
              return (
                <div key={g.title} className="rounded-2xl bg-white/[0.03] border border-white/5 overflow-hidden">
                  <button onClick={() => setOpenGroup(open ? null : g.title)} className="w-full flex items-center justify-between px-3.5 py-2.5 text-left">
                    <span className="text-[13px] font-medium text-neutral-200 capitalize">{g.title}</span>
                    <span className="text-[11px] text-neutral-500">{g.items.length}</span>
                  </button>
                  {open && (
                    <div className="px-2 pb-2.5 grid grid-cols-2 sm:grid-cols-3 gap-0.5">
                      {g.items.map((l) => (
                        <button key={l.to} onClick={() => go(l.to)} className="text-left text-[13px] text-neutral-400 hover:text-white hover:bg-white/5 rounded-xl px-2.5 py-2">{l.label}</button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
