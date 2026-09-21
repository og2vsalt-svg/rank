import { useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useRouter, type Route } from './Router';

type NavItem = { to: Route; label: string };

const primary: NavItem[] = [
  { to: 'vault', label: 'vault' },
  { to: 'harbor', label: 'harbor' },
  { to: 'lumen', label: 'lumen' },
  { to: 'meadow', label: 'meadow' },
  { to: 'drop', label: 'drop' },
];

const groups: { title: string; items: NavItem[] }[] = [
  {
    title: 'files',
    items: [
      { to: 'vault', label: 'vault' },
      { to: 'vale', label: 'vale' },
      { to: 'well', label: 'well' },
      { to: 'bridge', label: 'bridge' },
      { to: 'atlas', label: 'atlas' },
      { to: 'harbor', label: 'harbor' },
      { to: 'grove', label: 'grove' },
      { to: 'parcel', label: 'parcel' },
      { to: 'drop', label: 'drop' },
      { to: 'dew', label: 'dew' },
      { to: 'kiln', label: 'kiln' },
      { to: 'flint', label: 'flint' },
      { to: 'courier', label: 'courier' },
      { to: 'transfer', label: 'transfer' },
      { to: 'mirror', label: 'mirror' },
      { to: 'split', label: 'split' },
      { to: 'weave', label: 'weave' },
      { to: 'zip', label: 'zip' },
      { to: 'gauge', label: 'gauge' },
      { to: 'willow', label: 'willow' },
      { to: 'forge', label: 'forge' },
      { to: 'anvil', label: 'anvil' },
    ],
  },
  {
    title: 'share',
    items: [
      { to: 'cove', label: 'cove' },
      { to: 'orbit', label: 'orbit' },
      { to: 'signal', label: 'signal' },
      { to: 'beacon', label: 'beacon' },
      { to: 'folio', label: 'folio' },
      { to: 'relay', label: 'relay' },
      { to: 'links', label: 'links' },
      { to: 'qr', label: 'qr' },
      { to: 'tide', label: 'tide' },
      { to: 'spark', label: 'spark' },
      { to: 'lantern', label: 'lantern' },
      { to: 'capsule', label: 'capsule' },
      { to: 'ripple', label: 'ripple' },
      { to: 'haven', label: 'haven' },
      { to: 'spire', label: 'spire' },
      { to: 'moss', label: 'moss' },
    ],
  },
  {
    title: 'create',
    items: [
      { to: 'notes', label: 'notes' },
      { to: 'hearth', label: 'hearth' },
      { to: 'quill', label: 'quill' },
      { to: 'onyx', label: 'onyx' },
      { to: 'paste', label: 'paste' },
      { to: 'clip', label: 'clip' },
      { to: 'markdown', label: 'markdown' },
      { to: 'sketch', label: 'sketch' },
      { to: 'studio', label: 'studio' },
      { to: 'snapshot', label: 'snapshot' },
      { to: 'record', label: 'record' },
      { to: 'whisper', label: 'whisper' },
      { to: 'gallery', label: 'gallery' },
      { to: 'lumen', label: 'lumen' },
      { to: 'board', label: 'board' },
      { to: 'stash', label: 'stash' },
      { to: 'flux', label: 'flux' },
      { to: 'nook', label: 'nook' },
      { to: 'ember', label: 'ember' },
      { to: 'ridge', label: 'ridge' },
      { to: 'meadow', label: 'meadow' },
    ],
  },
  {
    title: 'tools',
    items: [
      { to: 'convert', label: 'convert' },
      { to: 'hash', label: 'hash' },
      { to: 'diff', label: 'diff' },
      { to: 'inspect', label: 'inspect' },
      { to: 'glide', label: 'glide' },
      { to: 'json', label: 'json' },
      { to: 'count', label: 'count' },
      { to: 'units', label: 'units' },
      { to: 'palette', label: 'palette' },
      { to: 'prism', label: 'prism' },
      { to: 'cipher', label: 'cipher' },
      { to: 'timer', label: 'timer' },
      { to: 'pulse', label: 'pulse' },
      { to: 'echo', label: 'echo' },
      { to: 'status', label: 'status' },
      { to: 'lark', label: 'lark' },
    ],
  },
  {
    title: 'more',
    items: [
      { to: 'keep', label: 'keep' },
      { to: 'compass', label: 'compass' },
      { to: 'drift', label: 'drift' },
      { to: 'tidy', label: 'tidy' },
      { to: 'quay', label: 'quay' },
      { to: 'lens', label: 'lens' },
      { to: 'loom', label: 'loom' },
      { to: 'aura', label: 'aura' },
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
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
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
          {primary.map((l) => (
            <button key={l.to} onClick={() => navigate(l.to)} className="text-[13px] text-neutral-400 hover:text-white px-2.5 py-1.5 rounded-full hover:bg-white/5 transition-colors">
              {l.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
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
                <button onClick={() => { setUserMenuOpen(false); navigate('vault'); }} className="w-full text-left px-4 py-2.5 text-sm text-neutral-300 hover:bg-white/5">open vault</button>
                <button onClick={() => { logout(); setUserMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-neutral-400 hover:text-red-400 hover:bg-white/5">log out</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <button onClick={() => navigate('login')} className="text-[13px] text-neutral-400 hover:text-white px-2.5 py-1.5 rounded-full transition-colors">log in</button>
              <button onClick={() => navigate('signup')} className="hidden sm:inline-flex text-[13px] font-medium px-3.5 py-1.5 rounded-full bg-white text-black hover:bg-neutral-200 transition-colors">sign up</button>
            </div>
          )}
          <button onClick={() => setMenuOpen(!menuOpen)} className="text-neutral-400 hover:text-white p-1.5 rounded-full hover:bg-white/5 ml-0.5" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen}>
            {menuOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></svg>
            )}
          </button>
        </div>
      </div>
      <div className={`border-t border-white/5 overflow-hidden transition-all duration-300 ease-out ${menuOpen ? 'max-h-[min(70vh,560px)] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="max-h-[min(70vh,560px)] overflow-y-auto overscroll-contain px-4 sm:px-5 py-3">
          <div className="flex gap-2 overflow-x-auto pb-3 mb-1 -mx-1 px-1 scrollbar-none">
            {primary.map((l) => (
              <button key={`chip-${l.to}`} onClick={() => go(l.to)} className="shrink-0 px-3.5 py-1.5 rounded-full bg-white/8 border border-white/10 text-[13px] text-neutral-200 hover:bg-white/12 hover:text-white">{l.label}</button>
            ))}
          </div>
          <div className="space-y-1.5">
            {groups.map((g) => {
              const open = openGroup === g.title;
              return (
                <div key={g.title} className="rounded-2xl bg-white/[0.03] border border-white/5 overflow-hidden">
                  <button onClick={() => setOpenGroup(open ? null : g.title)} className="w-full flex items-center justify-between px-3.5 py-2.5 text-left">
                    <span className="text-[13px] font-medium text-neutral-200 capitalize">{g.title}</span>
                    <span className="flex items-center gap-2">
                      <span className="text-[11px] text-neutral-500">{g.items.length}</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-neutral-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6" /></svg>
                    </span>
                  </button>
                  <div className={`overflow-hidden transition-all duration-250 ease-out ${open ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-2 pb-2.5 grid grid-cols-2 sm:grid-cols-3 gap-0.5">
                      {g.items.map((l) => (
                        <button key={l.to} onClick={() => go(l.to)} className="text-left text-[13px] text-neutral-400 hover:text-white hover:bg-white/5 rounded-xl px-2.5 py-2 transition-colors">{l.label}</button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
