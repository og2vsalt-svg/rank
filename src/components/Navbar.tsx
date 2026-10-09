import { useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useRouter, type Route } from './Router';

type NavItem = { to: Route; label: string };

const primary: NavItem[] = [
  { to: 'lunette', label: 'lunette' }, { to: 'astragal', label: 'astragal' }, { to: 'crossette', label: 'crossette' }, { to: 'tympanum', label: 'tympanum' }, { to: 'voussoir', label: 'voussoir' }, { to: 'lorgnette', label: 'lorgnette' }, { to: 'monocle', label: 'monocle' }, { to: 'reticule', label: 'reticule' }, { to: 'drawstring', label: 'drawstring' }, { to: 'oriel', label: 'oriel' }, { to: 'quillon', label: 'quillon' }, { to: 'scantling', label: 'scantling' },
  { to: 'margent', label: 'margent' },
  { to: 'lantern', label: 'lantern' }, { to: 'vault', label: 'vault' },
];

const groups: { title: string; items: NavItem[] }[] = [
  { title: 'new', items: [{ to: 'lunette', label: 'lunette' }, { to: 'astragal', label: 'astragal' }, { to: 'crossette', label: 'crossette' }, { to: 'tympanum', label: 'tympanum' }, { to: 'voussoir', label: 'voussoir' }, { to: 'lorgnette', label: 'lorgnette' }, { to: 'monocle', label: 'monocle' }, { to: 'reticule', label: 'reticule' }, { to: 'drawstring', label: 'drawstring' }, { to: 'oriel', label: 'oriel' }, { to: 'quillon', label: 'quillon' }, { to: 'scantling', label: 'scantling' }, { to: 'margent', label: 'margent' }, { to: 'ovolo', label: 'ovolo' }, { to: 'mutule', label: 'mutule' }, { to: 'plinth', label: 'plinth' }, { to: 'inlet', label: 'inlet' }, { to: 'cyma', label: 'cyma' }, { to: 'annulet', label: 'annulet' }, { to: 'reglet', label: 'reglet' }, { to: 'hoodmold', label: 'hoodmold' }, { to: 'gutta', label: 'gutta' }, { to: 'echinus', label: 'echinus' }, { to: 'cavetto', label: 'cavetto' }, { to: 'etui', label: 'etui' }, { to: 'bandbox', label: 'bandbox' }, { to: 'fascia', label: 'fascia' }, { to: 'finial', label: 'finial' }, { to: 'quirk', label: 'quirk' }, { to: 'mailslot', label: 'mailslot' }, { to: 'footnote', label: 'footnote' }, { to: 'quittance', label: 'quittance' }, { to: 'clip', label: 'clip' }, { to: 'studio', label: 'studio' }, { to: 'pulse', label: 'pulse' }, { to: 'rooms', label: 'rooms' }, { to: 'loft', label: 'loft' }, { to: 'witness', label: 'witness' }, { to: 'indent', label: 'indent' }, { to: 'haversack', label: 'haversack' }, { to: 'vault', label: 'vault' }] },
  { title: 'hosting', items: [{ to: 'lunette', label: 'lunette' }, { to: 'crossette', label: 'crossette' }, { to: 'tympanum', label: 'tympanum' }, { to: 'lorgnette', label: 'lorgnette' }, { to: 'scantling', label: 'scantling' }, { to: 'lantern', label: 'lantern' }, { to: 'ovolo', label: 'ovolo' }, { to: 'plinth', label: 'plinth' }, { to: 'cyma', label: 'cyma' }, { to: 'reglet', label: 'reglet' }, { to: 'etui', label: 'etui' }, { to: 'bandbox', label: 'bandbox' }, { to: 'mailslot', label: 'mailslot' }, { to: 'quittance', label: 'quittance' }, { to: 'clip', label: 'clip' }, { to: 'haversack', label: 'haversack' }, { to: 'handover', label: 'handover' }, { to: 'vault', label: 'vault' }] },
  { title: 'notes', items: [{ to: 'astragal', label: 'astragal' }, { to: 'monocle', label: 'monocle' }, { to: 'margent', label: 'margent' }, { to: 'inlet', label: 'inlet' }, { to: 'footnote', label: 'footnote' }, { to: 'letterpress', label: 'letterpress' }, { to: 'commonplace', label: 'commonplace' }, { to: 'ledger', label: 'ledger' }, { to: 'hearth', label: 'hearth' }] },
  { title: 'share', items: [{ to: 'lunette', label: 'lunette' }, { to: 'astragal', label: 'astragal' }, { to: 'crossette', label: 'crossette' }, { to: 'tympanum', label: 'tympanum' }, { to: 'voussoir', label: 'voussoir' }, { to: 'lorgnette', label: 'lorgnette' }, { to: 'reticule', label: 'reticule' }, { to: 'drawstring', label: 'drawstring' }, { to: 'scantling', label: 'scantling' }, { to: 'margent', label: 'margent' }, { to: 'lantern', label: 'lantern' }, { to: 'ovolo', label: 'ovolo' }, { to: 'mutule', label: 'mutule' }, { to: 'plinth', label: 'plinth' }, { to: 'annulet', label: 'annulet' }, { to: 'mailslot', label: 'mailslot' }, { to: 'quittance', label: 'quittance' }, { to: 'clip', label: 'clip' }, { to: 'handover', label: 'handover' }, { to: 'parcel', label: 'parcel' }] },
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
        <div className="hidden xl:flex items-center gap-1 min-w-0 overflow-x-auto">
          {primary.map((l, i) => (
            <button key={`${l.to}-${i}`} onClick={() => navigate(l.to)} className="text-[13px] text-neutral-400 hover:text-white px-2.5 py-1.5 rounded-full hover:bg-white/5 transition-colors duration-200">{l.label}</button>
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
                      {g.items.map((l, i) => (
                        <button key={`${g.title}-${l.to}-${i}`} onClick={() => go(l.to)} className="text-left text-[13px] text-neutral-400 hover:text-white hover:bg-white/5 rounded-xl px-2.5 py-2">{l.label}</button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p className="px-1 pt-3 text-[12px] text-white/35">older desks stay on their routes. paste /lunette/id, /crossette/id, or /s/id in Discord for a card.</p>
        </div>
      </div>
    </nav>
  );
}
