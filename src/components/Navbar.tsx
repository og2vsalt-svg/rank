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
  const [openGroup, setOpenGroup] = useState<string | null>('files');
  const [query, setQuery] = useState('');
  const { user, isLoggedIn, logout } = useAuth();
  const { navigate } = useRouter();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter((i) => i.label.toLowerCase().includes(q) || i.to.toLowerCase().includes(q)),
      }))
      .filter((g) => g.items.length > 0);
  }, [query]);

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
    const t = window.setTimeout(() => searchRef.current?.focus(), 80);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
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

      {/* outer dropdown — scrolls */}
      <div
        className={`border-t border-white/[0.06] overflow-hidden transition-[max-height,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          menuOpen ? 'max-h-[min(78vh,640px)] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="max-h-[min(78vh,640px)] overflow-y-auto overscroll-contain">
          <div className="max-w-6xl mx-auto px-4 sm:px-5 py-3 space-y-3">
            {/* quick chips */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5 -mx-0.5 px-0.5">
              {primary.map((l) => (
                <button
                  key={`chip-${l.to}`}
                  onClick={() => go(l.to)}
                  className="shrink-0 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-[12.5px] text-neutral-200 hover:bg-white/12 hover:text-white transition-colors"
                >
                  {l.label}
                </button>
              ))}
            </div>

            {/* search */}
            <div className="relative">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none"
                width="14"
                height="14"
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
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-[13px] text-white placeholder:text-neutral-500 outline-none focus:border-[#0a84ff]/40 transition-colors"
              />
            </div>

            {/* nested dropdowns */}
            <div className="space-y-1.5 pb-1">
              {filteredGroups.length === 0 ? (
                <p className="text-sm text-neutral-500 text-center py-8">no desks match “{query}”</p>
              ) : (
                filteredGroups.map((g) => {
                  const forceOpen = !!query.trim();
                  const open = forceOpen || openGroup === g.title;
                  return (
                    <div key={g.title} className="rounded-2xl bg-white/[0.03] border border-white/[0.07] overflow-hidden">
                      <button
                        type="button"
                        onClick={() => {
                          if (forceOpen) return;
                          setOpenGroup(open ? null : g.title);
                        }}
                        className="w-full flex items-center justify-between px-3.5 py-2.5 text-left hover:bg-white/[0.03] transition-colors"
                      >
                        <span className="text-[13px] font-medium text-neutral-200 capitalize">{g.title}</span>
                        <span className="flex items-center gap-2">
                          <span className="text-[11px] tabular-nums text-neutral-500 bg-white/5 px-1.5 py-0.5 rounded-md">
                            {g.items.length}
                          </span>
                          {!forceOpen && (
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              className={`text-neutral-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                            >
                              <path d="M6 9l6 6 6-6" />
                            </svg>
                          )}
                        </span>
                      </button>

                      {/* inner dropdown — all items, no clip */}
                      <div
                        className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                        }`}
                      >
                        <div className="overflow-hidden min-h-0">
                          <div className="px-2 pb-2.5 pt-0.5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-0.5">
                            {g.items.map((l) => (
                              <button
                                key={l.to}
                                type="button"
                                onClick={() => go(l.to)}
                                className="text-left text-[13px] text-neutral-400 hover:text-white hover:bg-white/[0.06] rounded-xl px-2.5 py-2 transition-colors truncate"
                                title={l.label}
                              >
                                {l.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
