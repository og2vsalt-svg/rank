import { useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useRouter, type Route } from './Router';

type NavItem = { to: Route; label: string };

const primary: NavItem[] = [
  { to: 'quoin', label: 'quoin' },
  { to: 'soffit', label: 'soffit' },
  { to: 'taffrail', label: 'taffrail' },
  { to: 'rondel', label: 'rondel' },
  { to: 'scuttle', label: 'scuttle' },
  { to: 'ketch', label: 'ketch' },
  { to: 'pallet', label: 'pallet' },
  { to: 'sextant', label: 'sextant' },
  { to: 'orrery', label: 'orrery' },
  { to: 'fluke', label: 'fluke' },
  { to: 'thwart', label: 'thwart' },
  { to: 'coaming', label: 'coaming' },
  { to: 'windlass', label: 'windlass' },
  { to: 'catenary', label: 'catenary' },
  { to: 'spar', label: 'spar' },
  { to: 'mullion', label: 'mullion' },
  { to: 'hawse', label: 'hawse' },
  { to: 'tannoy', label: 'tannoy' },
  { to: 'sundial', label: 'sundial' },
  { to: 'parcel', label: 'parcel' },
  { to: 'skerry', label: 'skerry' },
  { to: 'eyot', label: 'eyot' },
  { to: 'glade', label: 'glade' },
  { to: 'bothy', label: 'bothy' },
  { to: 'wherry', label: 'wherry' },
  { to: 'kettle', label: 'kettle' },
  { to: 'sill', label: 'sill' },
  { to: 'trestle', label: 'trestle' },
  { to: 'sluice', label: 'sluice' },
  { to: 'causeway', label: 'causeway' },
  { to: 'vestibule', label: 'vestibule' },
  { to: 'echo', label: 'echo' },
  { to: 'drift', label: 'drift' },
  { to: 'lattice', label: 'lattice' },
  { to: 'gazette', label: 'gazette' },
  { to: 'fathom', label: 'fathom' },
  { to: 'solarium', label: 'solarium' },
  { to: 'meridian', label: 'meridian' },
  { to: 'spire', label: 'spire' },
  { to: 'tally', label: 'tally' },
  { to: 'oriel', label: 'oriel' },
  { to: 'threshold', label: 'threshold' },
  { to: 'marquee', label: 'marquee' },
  { to: 'harbor', label: 'harbor' },
  { to: 'quay', label: 'quay' },
  { to: 'signal', label: 'signal' },
  { to: 'ledger', label: 'ledger' },
  { to: 'vault', label: 'vault' },
  { to: 'drop', label: 'drop' },
  { to: 'well', label: 'well' },
  { to: 'lumen', label: 'lumen' },
  { to: 'deadeye', label: 'deadeye' },
  { to: 'scupper', label: 'scupper' },
  { to: 'gunwale', label: 'gunwale' },
  { to: 'companionway', label: 'companionway' },
  { to: 'funicular', label: 'funicular' },
  { to: 'pintle', label: 'pintle' },
  { to: 'kevel', label: 'kevel' },
  { to: 'fairlead', label: 'fairlead' },
  { to: 'halyard', label: 'halyard' },
];

const groups: { title: string; items: NavItem[] }[] = [
  {
    title: 'files',
    items: [
      { to: 'scuttle', label: 'scuttle' },
      { to: 'ketch', label: 'ketch' },
      { to: 'fluke', label: 'fluke' },
      { to: 'thwart', label: 'thwart' },
      { to: 'windlass', label: 'windlass' },
      { to: 'parcel', label: 'parcel' },
      { to: 'skerry', label: 'skerry' },
      { to: 'wherry', label: 'wherry' },
      { to: 'kettle', label: 'kettle' },
      { to: 'sluice', label: 'sluice' },
      { to: 'causeway', label: 'causeway' },
      { to: 'vestibule', label: 'vestibule' },
      { to: 'oriel', label: 'oriel' },
      { to: 'harbor', label: 'harbor' },
      { to: 'quay', label: 'quay' },
      { to: 'drop', label: 'drop' },
      { to: 'deadeye', label: 'deadeye' },
      { to: 'companionway', label: 'companionway' },
      { to: 'vault', label: 'vault' },
      { to: 'lantern', label: 'lantern' },
      { to: 'lodestone', label: 'lodestone' },
      { to: 'reliquary', label: 'reliquary' },
      { to: 'towpath', label: 'towpath' },
      { to: 'lockgate', label: 'lockgate' },
      { to: 'lumen', label: 'lumen' },
      { to: 'nave', label: 'nave' },
      { to: 'pintle', label: 'pintle' },
      { to: 'funicular', label: 'funicular' },
    ],
  },
  {
    title: 'share',
    items: [
      { to: 'quoin', label: 'quoin' },
      { to: 'soffit', label: 'soffit' },
      { to: 'rondel', label: 'rondel' },
      { to: 'taffrail', label: 'taffrail' },
      { to: 'coaming', label: 'coaming' },
      { to: 'spar', label: 'spar' },
      { to: 'hawse', label: 'hawse' },
      { to: 'mullion', label: 'mullion' },
      { to: 'tannoy', label: 'tannoy' },
      { to: 'eyot', label: 'eyot' },
      { to: 'bothy', label: 'bothy' },
      { to: 'trestle', label: 'trestle' },
      { to: 'gazette', label: 'gazette' },
      { to: 'echo', label: 'echo' },
      { to: 'threshold', label: 'threshold' },
      { to: 'marquee', label: 'marquee' },
      { to: 'signal', label: 'signal' },
      { to: 'ledger', label: 'ledger' },
      { to: 'lintel', label: 'lintel' },
      { to: 'haven', label: 'haven' },
      { to: 'palimpsest', label: 'palimpsest' },
      { to: 'keyring', label: 'keyring' },
      { to: 'well', label: 'well' },
      { to: 'porch', label: 'porch' },
      { to: 'kevel', label: 'kevel' },
      { to: 'fairlead', label: 'fairlead' },
      { to: 'halyard', label: 'halyard' },
    ],
  },
  {
    title: 'tools',
    items: [
      { to: 'pallet', label: 'pallet' },
      { to: 'sextant', label: 'sextant' },
      { to: 'orrery', label: 'orrery' },
      { to: 'catenary', label: 'catenary' },
      { to: 'sundial', label: 'sundial' },
      { to: 'glade', label: 'glade' },
      { to: 'sill', label: 'sill' },
      { to: 'fathom', label: 'fathom' },
      { to: 'solarium', label: 'solarium' },
      { to: 'meridian', label: 'meridian' },
      { to: 'spire', label: 'spire' },
      { to: 'tally', label: 'tally' },
      { to: 'drift', label: 'drift' },
      { to: 'lattice', label: 'lattice' },
      { to: 'loom', label: 'loom' },
      { to: 'hash', label: 'hash' },
      { to: 'convert', label: 'convert' },
      { to: 'diff', label: 'diff' },
      { to: 'fid', label: 'fid' },
      { to: 'buoy', label: 'buoy' },
      { to: 'quill', label: 'quill' },
      { to: 'prism', label: 'prism' },
      { to: 'mosaic', label: 'mosaic' },
      { to: 'kiln', label: 'kiln' },
      { to: 'transit', label: 'transit' },
      { to: 'still', label: 'still' },
      { to: 'glyph', label: 'glyph' },
      { to: 'scupper', label: 'scupper' },
      { to: 'gunwale', label: 'gunwale' },
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
