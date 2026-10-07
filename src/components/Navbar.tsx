import { useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useRouter, type Route } from './Router';

type NavItem = { to: Route; label: string };

const primary: NavItem[] = [
  { to: 'dado', label: 'dado' },
  { to: 'linen', label: 'linen' },
  { to: 'stillroom', label: 'stillroom' },
  { to: 'keepsake', label: 'keepsake' },
  { to: 'passage', label: 'passage' },
  { to: 'courier', label: 'courier' },
  { to: 'satchel', label: 'satchel' },
  { to: 'copydesk', label: 'copy desk' },
  { to: 'vault', label: 'vault' },
  { to: 'inlay', label: 'inlay' },
  { to: 'pallet', label: 'pallet' },
  { to: 'unfurl', label: 'unfurl' },
];

const groups: { title: string; items: NavItem[] }[] = [
  { title: 'new', items: [{ to: 'dado', label: 'dado' }, { to: 'pallet', label: 'pallet' }, { to: 'unfurl', label: 'unfurl' }, { to: 'linen', label: 'linen' }, { to: 'stillroom', label: 'stillroom' }, { to: 'keepsake', label: 'keepsake' }, { to: 'passage', label: 'passage' }, { to: 'cardroom', label: 'card room' }, { to: 'folio', label: 'folio' }, { to: 'swatch', label: 'swatch' }, { to: 'margin', label: 'margin' }, { to: 'apron', label: 'apron' }, { to: 'mantel', label: 'mantel' }, { to: 'porch', label: 'porch' }, { to: 'hearth', label: 'hearth' }, { to: 'billet', label: 'billet' }, { to: 'ack', label: 'ack' }, { to: 'hamper', label: 'hamper' }, { to: 'marginalia', label: 'marginalia' }, { to: 'outbox', label: 'outbox' }, { to: 'postbag', label: 'postbag' }, { to: 'windlass', label: 'windlass' }, { to: 'inkstand', label: 'inkstand' }, { to: 'waypost', label: 'waypost' }, { to: 'lodestone', label: 'lodestone' }, { to: 'mariner', label: 'mariner' }, { to: 'logline', label: 'logline' }, { to: 'chipboard', label: 'chipboard' }, { to: 'watchglass', label: 'watchglass' }, { to: 'sandglass', label: 'sandglass' }, { to: 'fathom', label: 'fathom' }, { to: 'sconce', label: 'sconce' }, { to: 'oakdesk', label: 'oakdesk' }, { to: 'daybook', label: 'daybook' }] },
  { title: 'hosting', items: [{ to: 'dado', label: 'dado' }, { to: 'pallet', label: 'pallet' }, { to: 'linen', label: 'linen' }, { to: 'keepsake', label: 'keepsake' }, { to: 'passage', label: 'passage' }, { to: 'folio', label: 'folio' }, { to: 'swatch', label: 'swatch' }, { to: 'flyleaf', label: 'flyleaf' }, { to: 'endpaper', label: 'endpaper' }, { to: 'apron', label: 'apron' }, { to: 'porch', label: 'porch' }, { to: 'hamper', label: 'hamper' }, { to: 'outbox', label: 'outbox' }, { to: 'windlass', label: 'windlass' }, { to: 'waypost', label: 'waypost' }, { to: 'lodestone', label: 'lodestone' }, { to: 'logline', label: 'logline' }, { to: 'fathom', label: 'fathom' }, { to: 'oakdesk', label: 'oakdesk' }, { to: 'daybook', label: 'daybook' }, { to: 'vault', label: 'vault' }, { to: 'scuttle', label: 'scuttle' }, { to: 'forefoot', label: 'forefoot' }, { to: 'catfall', label: 'catfall' }] },
  { title: 'notes', items: [{ to: 'stillroom', label: 'stillroom' }, { to: 'margin', label: 'margin' }, { to: 'mantel', label: 'mantel' }, { to: 'hearth', label: 'hearth' }, { to: 'marginalia', label: 'marginalia' }, { to: 'inkstand', label: 'inkstand' }, { to: 'mariner', label: 'mariner' }, { to: 'sconce', label: 'sconce' }, { to: 'pinboard', label: 'pinboard' }, { to: 'wayleave', label: 'wayleave' }, { to: 'nightglass', label: 'nightglass' }, { to: 'quire', label: 'quire' }, { to: 'docket', label: 'docket' }, { to: 'vesper', label: 'vesper' }] },
  { title: 'share', items: [{ to: 'satchel', label: 'satchel' }, { to: 'copydesk', label: 'copy desk' }, { to: 'dado', label: 'dado' }, { to: 'pallet', label: 'pallet' }, { to: 'linen', label: 'linen' }, { to: 'keepsake', label: 'keepsake' }, { to: 'cardroom', label: 'card room' }, { to: 'folio', label: 'folio' }, { to: 'swatch', label: 'swatch' }, { to: 'porch', label: 'porch' }, { to: 'hamper', label: 'hamper' }, { to: 'marginalia', label: 'marginalia' }, { to: 'outbox', label: 'outbox' }, { to: 'postbag', label: 'postbag' }, { to: 'waypost', label: 'waypost' }, { to: 'lodestone', label: 'lodestone' }, { to: 'chipboard', label: 'chipboard' }, { to: 'fathom', label: 'fathom' }, { to: 'coak', label: 'coak' }, { to: 'thimble', label: 'thimble' }, { to: 'grommet', label: 'grommet' }, { to: 'deadlight', label: 'deadlight' }, { to: 'tender', label: 'tender' }, { to: 'cask', label: 'cask' }] },
  { title: 'tools', items: [{ to: 'unfurl', label: 'unfurl' }, { to: 'passage', label: 'passage' }, { to: 'swatch', label: 'swatch' }, { to: 'hash', label: 'hash' }, { to: 'convert', label: 'convert' }, { to: 'diff', label: 'diff' }, { to: 'sounding', label: 'sounding' }, { to: 'counter', label: 'counter' }] },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>('new');
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
        <button onClick={() => navigate('home')} className="text-lg font-semibold tracking-tight text-white shrink-0">rank<span className="text-[#0a84ff]">vault</span></button>
        <div className="hidden lg:flex items-center gap-1 min-w-0">
          {primary.map((l) => (
            <button key={l.to} onClick={() => navigate(l.to)} className="text-[13px] text-neutral-400 hover:text-white px-2.5 py-1.5 rounded-full hover:bg-white/5 transition-colors duration-200">{l.label}</button>
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
                <div className="px-4 py-3 border-b border-white/5"><p className="text-sm font-medium text-white truncate">{user!.username}</p></div>
                <button onClick={() => { setUserMenuOpen(false); navigate('vault'); }} className="w-full text-left px-4 py-3 text-sm text-neutral-300 hover:bg-white/5">open vault</button>
                <button onClick={() => { logout(); setUserMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-neutral-400 hover:text-red-400 hover:bg-white/5">log out</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <button onClick={() => navigate('login')} className="text-[13px] text-neutral-400 hover:text-white px-2.5 py-1.5 rounded-full">log in</button>
              <button onClick={() => navigate('signup')} className="hidden sm:inline-flex text-[13px] font-medium px-3.5 py-1.5 rounded-full bg-white text-black hover:bg-neutral-200 transition">sign up</button>
            </div>
          )}
          <button onClick={() => setMenuOpen(!menuOpen)} className="text-neutral-400 hover:text-white p-1.5 rounded-full hover:bg-white/5" aria-label="menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></svg>
          </button>
        </div>
      </div>
      <div className={`border-t border-white/5 overflow-hidden transition-all duration-300 ease-out ${menuOpen ? 'max-h-[min(75vh,620px)] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="max-h-[min(75vh,620px)] overflow-y-auto px-4 sm:px-5 py-3">
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
                        <button key={l.to + l.label} onClick={() => go(l.to)} className="text-left text-[13px] text-neutral-400 hover:text-white hover:bg-white/5 rounded-xl px-2.5 py-2">{l.label}</button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p className="px-1 pt-3 text-[12px] text-white/35">older desks stay on their routes. paste /dado/id, /pallet/id, /keepsake/id, /linen/id, or /s/id in Discord for a card.</p>
        </div>
      </div>
    </nav>
  );
}
