import { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useRouter, type Route } from './Router';

type NavItem = { to: Route; label: string };

const primary: NavItem[] = [
  { to: 'vault', label: 'vault' },
  { to: 'drop', label: 'drop' },
  { to: 'lattice', label: 'lattice' },
  { to: 'slip', label: 'slip' },
  { to: 'relay', label: 'relay' },
  { to: 'quilt', label: 'quilt' },
  { to: 'pinnacle', label: 'pinnacle' },
  { to: 'stillroom', label: 'stillroom' },
];

const groups: { title: string; items: NavItem[] }[] = [
  {
    title: 'files',
    items: [
      { to: 'vault', label: 'vault' },
      { to: 'drop', label: 'drop' },
      { to: 'lattice', label: 'lattice' },
      { to: 'slip', label: 'slip' },
      { to: 'pinnacle', label: 'pinnacle' },
      { to: 'waymark', label: 'waymark' },
      { to: 'harvest', label: 'harvest' },
      { to: 'wellspring', label: 'wellspring' },
      { to: 'solarium', label: 'solarium' },
      { to: 'vestibule', label: 'vestibule' },
      { to: 'keystone', label: 'keystone' },
      { to: 'lintel', label: 'lintel' },
      { to: 'terrace', label: 'terrace' },
      { to: 'sundial', label: 'sundial' },
      { to: 'cistern', label: 'cistern' },
      { to: 'plinth', label: 'plinth' },
      { to: 'rookery', label: 'rookery' },
      { to: 'scrip', label: 'scrip' },
      { to: 'silo', label: 'silo' },
      { to: 'ridge', label: 'ridge' },
      { to: 'pallet', label: 'pallet' },
      { to: 'tandem', label: 'tandem' },
      { to: 'tide', label: 'tide' },
      { to: 'convoy', label: 'convoy' },
      { to: 'portage', label: 'portage' },
      { to: 'vale', label: 'vale' },
      { to: 'harbor', label: 'harbor' },
      { to: 'wick', label: 'wick' },
      { to: 'nest', label: 'nest' },
      { to: 'kiln', label: 'kiln' },
      { to: 'meadow', label: 'meadow' },
      { to: 'parcel', label: 'parcel' },
      { to: 'nimbus', label: 'nimbus' },
      { to: 'manor', label: 'manor' },
      { to: 'locket', label: 'locket' },
      { to: 'relic', label: 'relic' },
      { to: 'keel', label: 'keel' },
      { to: 'spool', label: 'spool' },
      { to: 'sluice', label: 'sluice' },
      { to: 'pebble', label: 'pebble' },
      { to: 'pollen', label: 'pollen' },
      { to: 'gully', label: 'gully' },
      { to: 'glacier', label: 'glacier' },
      { to: 'quarry', label: 'quarry' },
      { to: 'spire', label: 'spire' },
      { to: 'lagoon', label: 'lagoon' },
      { to: 'keepsake', label: 'keepsake' },
    ],
  },
  {
    title: 'share',
    items: [
      { to: 'relay', label: 'relay' },
      { to: 'quilt', label: 'quilt' },
      { to: 'ripple', label: 'ripple' },
      { to: 'stillroom', label: 'stillroom' },
      { to: 'hearth', label: 'hearth' },
      { to: 'oxbow', label: 'oxbow' },
      { to: 'aegis', label: 'aegis' },
      { to: 'slate', label: 'slate' },
      { to: 'solace', label: 'solace' },
      { to: 'horizon', label: 'horizon' },
      { to: 'mirage', label: 'mirage' },
      { to: 'gazette', label: 'gazette' },
      { to: 'bazaar', label: 'bazaar' },
      { to: 'atoll', label: 'atoll' },
      { to: 'kite', label: 'kite' },
      { to: 'isthmus', label: 'isthmus' },
      { to: 'grove', label: 'grove' },
      { to: 'pinion', label: 'pinion' },
      { to: 'lark', label: 'lark' },
      { to: 'inlet', label: 'inlet' },
      { to: 'ticker', label: 'ticker' },
      { to: 'pulse', label: 'pulse' },
      { to: 'hush', label: 'hush' },
      { to: 'orbit', label: 'orbit' },
      { to: 'signal', label: 'signal' },
      { to: 'ledger', label: 'ledger' },
      { to: 'glyph', label: 'glyph' },
      { to: 'quay', label: 'quay' },
      { to: 'zinc', label: 'zinc' },
      { to: 'lumen', label: 'lumen' },
      { to: 'wisp', label: 'wisp' },
      { to: 'vesper', label: 'vesper' },
      { to: 'rill', label: 'rill' },
      { to: 'solstice', label: 'solstice' },
      { to: 'lantern', label: 'lantern' },
      { to: 'reef', label: 'reef' },
      { to: 'lichen', label: 'lichen' },
      { to: 'moss', label: 'moss' },
      { to: 'lattice', label: 'lattice' },
      { to: 'slip', label: 'slip' },
    ],
  },
  {
    title: 'create',
    items: [
      { to: 'stillroom', label: 'stillroom' },
      { to: 'nook', label: 'nook' },
      { to: 'iris', label: 'iris' },
      { to: 'filament', label: 'filament' },
      { to: 'slate', label: 'slate' },
      { to: 'octave', label: 'octave' },
      { to: 'halo', label: 'halo' },
      { to: 'sable', label: 'sable' },
      { to: 'studio', label: 'studio' },
      { to: 'saffron', label: 'saffron' },
      { to: 'bramble', label: 'bramble' },
      { to: 'vellum', label: 'vellum' },
      { to: 'opal', label: 'opal' },
      { to: 'thorn', label: 'thorn' },
      { to: 'marrow', label: 'marrow' },
      { to: 'notes', label: 'notes' },
      { to: 'paste', label: 'paste' },
      { to: 'markdown', label: 'markdown' },
      { to: 'sketch', label: 'sketch' },
      { to: 'helix', label: 'helix' },
      { to: 'quill', label: 'quill' },
      { to: 'loom', label: 'loom' },
      { to: 'prism', label: 'prism' },
      { to: 'mosaic', label: 'mosaic' },
      { to: 'atelier', label: 'atelier' },
      { to: 'ledge', label: 'ledge' },
      { to: 'pavilion', label: 'pavilion' },
      { to: 'sanctum', label: 'sanctum' },
      { to: 'umber', label: 'umber' },
      { to: 'chapel', label: 'chapel' },
      { to: 'basin', label: 'basin' },
      { to: 'willow', label: 'willow' },
      { to: 'solace', label: 'solace' },
    ],
  },
  {
    title: 'tools',
    items: [
      { to: 'harvest', label: 'harvest' },
      { to: 'waymark', label: 'waymark' },
      { to: 'ripple', label: 'ripple' },
      { to: 'cistern', label: 'cistern' },
      { to: 'ridge', label: 'ridge' },
      { to: 'silo', label: 'silo' },
      { to: 'copper', label: 'copper' },
      { to: 'quartz', label: 'quartz' },
      { to: 'nadir', label: 'nadir' },
      { to: 'sieve', label: 'sieve' },
      { to: 'palette', label: 'palette' },
      { to: 'convert', label: 'convert' },
      { to: 'hash', label: 'hash' },
      { to: 'qr', label: 'qr' },
      { to: 'diff', label: 'diff' },
      { to: 'zip', label: 'zip' },
      { to: 'status', label: 'status' },
      { to: 'meridian', label: 'meridian' },
      { to: 'tempo', label: 'tempo' },
      { to: 'trestle', label: 'trestle' },
      { to: 'observatory', label: 'observatory' },
      { to: 'atrium', label: 'atrium' },
      { to: 'glacier', label: 'glacier' },
      { to: 'gully', label: 'gully' },
      { to: 'quarry', label: 'quarry' },
      { to: 'keepsake', label: 'keepsake' },
    ],
  },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState(groups[0].title);
  const [query, setQuery] = useState('');
  const { user, isLoggedIn, logout } = useAuth();
  const { navigate } = useRouter();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const q = query.trim().toLowerCase();
  const searching = q.length > 0;

  const activeItems = useMemo(() => {
    if (searching) {
      return groups.flatMap((g) =>
        g.items
          .filter((i) => i.label.toLowerCase().includes(q) || i.to.toLowerCase().includes(q))
          .map((i) => ({ ...i, group: g.title })),
      );
    }
    const g = groups.find((x) => x.title === activeGroup) || groups[0];
    return g.items.map((i) => ({ ...i, group: g.title }));
  }, [q, searching, activeGroup]);

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
    if (!menuOpen) {
      setQuery('');
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = window.setTimeout(() => searchRef.current?.focus(), 100);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const go = (to: Route) => {
    setMenuOpen(false);
    setQuery('');
    navigate(to);
  };

  return (
    <>
      <nav className="fixed top-0 inset-x-0 z-50 glass border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-5 h-14 flex items-center justify-between gap-3">
          <button onClick={() => navigate('home')} className="text-lg font-semibold tracking-tight text-white shrink-0">
            rank<span className="text-[#0a84ff]">vault</span>
          </button>

          <div className="hidden lg:flex items-center gap-0.5 min-w-0">
            {primary.slice(0, 6).map((l) => (
              <button
                key={l.to}
                onClick={() => navigate(l.to)}
                className="text-[13px] text-neutral-400 hover:text-white px-2.5 py-1.5 rounded-full hover:bg-white/5 transition-colors"
              >
                {l.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isLoggedIn ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-full hover:bg-white/5 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-[#0a84ff]/15 border border-[#0a84ff]/25 flex items-center justify-center">
                    <span className="text-xs font-bold text-[#0a84ff]">{user!.username.charAt(0).toUpperCase()}</span>
                  </div>
                  <span className="hidden sm:inline text-sm text-neutral-300 max-w-[100px] truncate">{user!.username}</span>
                </button>
                <div
                  className={`absolute right-0 top-full mt-1.5 w-56 rounded-2xl glass border border-white/10 shadow-2xl shadow-black/50 overflow-hidden transition-all duration-200 origin-top-right ${
                    userMenuOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
                  }`}
                >
                  <div className="px-4 py-3 border-b border-white/8">
                    <p className="text-sm font-medium text-white truncate">{user!.username}</p>
                    <p className="text-xs text-neutral-500 truncate">{user!.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate('vault');
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-neutral-300 hover:bg-white/5 transition-colors"
                  >
                    open vault
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      setUserMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-neutral-400 hover:text-red-400 hover:bg-white/5 transition-colors"
                  >
                    log out
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <button onClick={() => navigate('login')} className="text-[13px] text-neutral-400 hover:text-white px-2.5 py-1.5 rounded-full transition-colors">
                  log in
                </button>
                <button
                  onClick={() => navigate('signup')}
                  className="hidden sm:inline-flex text-[13px] font-medium px-3.5 py-1.5 rounded-full bg-white text-black hover:bg-neutral-200 transition-colors"
                >
                  sign up
                </button>
              </div>
            )}

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`p-1.5 rounded-full transition-colors ${
                menuOpen ? 'bg-white/10 text-white' : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="17" x2="20" y2="17" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* full sheet */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <button type="button" aria-label="Close menu" className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />

        <div
          className={`absolute inset-x-0 top-14 bottom-0 sm:inset-x-4 sm:top-[4.25rem] sm:bottom-6 sm:max-w-5xl sm:mx-auto flex flex-col rounded-none sm:rounded-[28px] border border-white/10 bg-[#0c0c0e]/95 backdrop-blur-2xl shadow-2xl shadow-black/60 overflow-hidden transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            menuOpen ? 'translate-y-0' : '-translate-y-3'
          }`}
        >
          {/* header */}
          <div className="shrink-0 px-4 sm:px-6 pt-4 pb-3 border-b border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.12em] text-neutral-500 font-medium">browse</p>
                <p className="text-base font-semibold text-white tracking-tight">all desks</p>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="hidden sm:inline-flex text-xs text-neutral-500 hover:text-white px-3 py-1.5 rounded-full hover:bg-white/5 transition-colors"
              >
                esc
              </button>
            </div>

            <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
              {primary.map((l) => (
                <button
                  key={`p-${l.to}`}
                  onClick={() => go(l.to)}
                  className="shrink-0 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-[12.5px] text-neutral-300 hover:text-white hover:bg-white/10 hover:border-white/15 transition-colors"
                >
                  {l.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="search desks…"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-[13px] text-white placeholder:text-neutral-500 outline-none focus:border-[#0a84ff]/45 focus:bg-white/[0.06] transition-colors"
              />
            </div>
          </div>

          {/* body */}
          <div className="flex-1 min-h-0 flex flex-col sm:flex-row">
            {/* category rail */}
            {!searching && (
              <div className="sm:w-44 shrink-0 border-b sm:border-b-0 sm:border-r border-white/[0.06] px-2 py-2 sm:py-3 flex sm:flex-col gap-1 overflow-x-auto sm:overflow-x-visible scrollbar-none">
                {groups.map((g) => {
                  const on = activeGroup === g.title;
                  return (
                    <button
                      key={g.title}
                      onClick={() => setActiveGroup(g.title)}
                      className={`shrink-0 flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left transition-colors ${
                        on ? 'bg-white/[0.09] text-white' : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <span className="text-[13px] font-medium capitalize">{g.title}</span>
                      <span className={`text-[10px] tabular-nums ${on ? 'text-neutral-400' : 'text-neutral-600'}`}>{g.items.length}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* items */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 sm:px-4 py-3">
              {activeItems.length === 0 ? (
                <p className="text-sm text-neutral-500 text-center py-16">no desks match “{query}”</p>
              ) : (
                <>
                  <p className="text-[11px] uppercase tracking-[0.1em] text-neutral-500 px-1.5 mb-2">
                    {searching ? `${activeItems.length} results` : activeGroup}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1">
                    {activeItems.map((l) => (
                      <button
                        key={`${l.group}-${l.to}`}
                        onClick={() => go(l.to)}
                        className="group text-left rounded-xl px-3 py-2.5 hover:bg-white/[0.06] transition-colors"
                      >
                        <span className="block text-[13px] text-neutral-300 group-hover:text-white truncate transition-colors">{l.label}</span>
                        {searching && (
                          <span className="block text-[10px] text-neutral-600 capitalize mt-0.5">{l.group}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
