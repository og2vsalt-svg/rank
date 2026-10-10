import { useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useRouter, type Route } from './Router';

type NavItem = { to: Route; label: string };

const primary: NavItem[] = [
  { to: 'studio', label: 'studio' }, { to: 'gallery', label: 'gallery' }, { to: 'vignette', label: 'vignette' }, { to: 'oratory', label: 'oratory' }, { to: 'sharehub', label: 'sharehub' }, { to: 'mosaic', label: 'mosaic' }, { to: 'canvas', label: 'canvas' }, { to: 'scriptorium', label: 'scriptorium' }, { to: 'reliquary', label: 'reliquary' }, { to: 'vault', label: 'vault' },
];

const groups: { title: string; items: NavItem[] }[] = [
  { title: 'new', items: [{ to: 'scriptorium', label: 'scriptorium' }, { to: 'vignette', label: 'vignette' }, { to: 'studio', label: 'studio' }, { to: 'oratory', label: 'oratory' }, { to: 'gallery', label: 'gallery' }, { to: 'sharehub', label: 'sharehub' }, { to: 'mosaic', label: 'mosaic' }, { to: 'canvas', label: 'canvas' }, { to: 'reliquary', label: 'reliquary' }, { to: 'cartouche', label: 'cartouche' }, { to: 'fillet', label: 'fillet' }, { to: 'impost', label: 'impost' }, { to: 'reading', label: 'reading' }, { to: 'abacus', label: 'abacus' }, { to: 'campanile', label: 'campanile' }, { to: 'ogee', label: 'ogee' }, { to: 'socle', label: 'socle' }, { to: 'fluting', label: 'fluting' }, { to: 'stylobate', label: 'stylobate' }, { to: 'coffer', label: 'coffer' }, { to: 'corbel', label: 'corbel' }, { to: 'metope', label: 'metope' }, { to: 'triglyph', label: 'triglyph' }, { to: 'modillion', label: 'modillion' }, { to: 'dentil', label: 'dentil' }, { to: 'chevron', label: 'chevron' }, { to: 'patera', label: 'patera' }, { to: 'labelstop', label: 'labelstop' }, { to: 'lunette', label: 'lunette' }, { to: 'astragal', label: 'astragal' }, { to: 'crossette', label: 'crossette' }, { to: 'tympanum', label: 'tympanum' }, { to: 'voussoir', label: 'voussoir' }, { to: 'lorgnette', label: 'lorgnette' }, { to: 'monocle', label: 'monocle' }, { to: 'reticule', label: 'reticule' }, { to: 'drawstring', label: 'drawstring' }, { to: 'oriel', label: 'oriel' }, { to: 'quillon', label: 'quillon' }, { to: 'scantling', label: 'scantling' }, { to: 'margent', label: 'margent' }, { to: 'ovolo', label: 'ovolo' }, { to: 'mutule', label: 'mutule' }, { to: 'plinth', label: 'plinth' }, { to: 'inlet', label: 'inlet' }, { to: 'cyma', label: 'cyma' }, { to: 'annulet', label: 'annulet' }, { to: 'reglet', label: 'reglet' }, { to: 'hoodmold', label: 'hoodmold' }, { to: 'gutta', label: 'gutta' }, { to: 'echinus', label: 'echinus' }, { to: 'cavetto', label: 'cavetto' }, { to: 'etui', label: 'etui' }, { to: 'bandbox', label: 'bandbox' }, { to: 'fascia', label: 'fascia' }, { to: 'finial', label: 'finial' }, { to: 'quirk', label: 'quirk' }, { to: 'mailslot', label: 'mailslot' }, { to: 'footnote', label: 'footnote' }, { to: 'quittance', label: 'quittance' }, { to: 'clip', label: 'clip' }, { to: 'pulse', label: 'pulse' }, { to: 'rooms', label: 'rooms' }, { to: 'loft', label: 'loft' }, { to: 'witness', label: 'witness' }, { to: 'indent', label: 'indent' }, { to: 'haversack', label: 'haversack' }, { to: 'vault', label: 'vault' }] },
  { title: 'share', items: [{ to: 'scriptorium', label: 'scriptorium' }, { to: 'vignette', label: 'vignette' }, { to: 'studio', label: 'studio' }, { to: 'gallery', label: 'gallery' }, { to: 'sharehub', label: 'sharehub' }, { to: 'mosaic', label: 'mosaic' }, { to: 'canvas', label: 'canvas' }, { to: 'reliquary', label: 'reliquary' }, { to: 'cartouche', label: 'cartouche' }, { to: 'fillet', label: 'fillet' }, { to: 'impost', label: 'impost' }, { to: 'ogee', label: 'ogee' }, { to: 'socle', label: 'socle' }, { to: 'fluting', label: 'fluting' }, { to: 'stylobate', label: 'stylobate' }, { to: 'coffer', label: 'coffer' }, { to: 'corbel', label: 'corbel' }, { to: 'lunette', label: 'lunette' }, { to: 'astragal', label: 'astragal' }, { to: 'crossette', label: 'crossette' }, { to: 'tympanum', label: 'tympanum' }, { to: 'voussoir', label: 'voussoir' }, { to: 'lorgnette', label: 'lorgnette' }, { to: 'reticule', label: 'reticule' }, { to: 'drawstring', label: 'drawstring' }, { to: 'scantling', label: 'scantling' }, { to: 'margent', label: 'margent' }, { to: 'lantern', label: 'lantern' }, { to: 'ovolo', label: 'ovolo' }, { to: 'mutule', label: 'mutule' }, { to: 'plinth', label: 'plinth' }, { to: 'annulet', label: 'annulet' }, { to: 'mailslot', label: 'mailslot' }, { to: 'quittance', label: 'quittance' }, { to: 'clip', label: 'clip' }, { to: 'handover', label: 'handover' }, { to: 'parcel', label: 'parcel' }] },
  { title: 'vault', items: [{ to: 'vault', label: 'vault' }, { to: 'loft', label: 'loft' }, { to: 'haversack', label: 'haversack' }, { to: 'keep', label: 'keep' }, { to: 'oakdesk', label: 'oakdesk' }, { to: 'daybook', label: 'daybook' }, { to: 'ledger', label: 'ledger' }, { to: 'passbook', label: 'passbook' }, { to: 'commonplace', label: 'commonplace' }, { to: 'pinboard', label: 'pinboard' }, { to: 'outbox', label: 'outbox' }, { to: 'hamper', label: 'hamper' }, { to: 'sideboard', label: 'sideboard' }, { to: 'inkstand', label: 'inkstand' }, { to: 'letterpress', label: 'letterpress' }, { to: 'colophon', label: 'colophon' }, { to: 'flyleaf', label: 'flyleaf' }, { to: 'endpaper', label: 'endpaper' }, { to: 'dossier', label: 'dossier' }, { to: 'pressmark', label: 'pressmark' }, { to: 'seal', label: 'seal' }, { to: 'quittance', label: 'quittance' }, { to: 'acquittance', label: 'acquittance' }, { to: 'spandrel', label: 'spandrel' }, { to: 'stringcourse', label: 'stringcourse' }, { to: 'beltcourse', label: 'beltcourse' }, { to: 'plinth', label: 'plinth' }, { to: 'inlet', label: 'inlet' }, { to: 'architrave', label: 'architrave' }, { to: 'taenia', label: 'taenia' }, { to: 'scantling', label: 'scantling' }, { to: 'margent', label: 'margent' }, { to: 'oriel', label: 'oriel' }, { to: 'quillon', label: 'quillon' }, { to: 'soffit', label: 'soffit' }, { to: 'volute', label: 'volute' }, { to: 'courier', label: 'courier' }, { to: 'tally', label: 'tally' }, { to: 'reticule', label: 'reticule' }, { to: 'drawstring', label: 'drawstring' }, { to: 'lorgnette', label: 'lorgnette' }, { to: 'monocle', label: 'monocle' }, { to: 'gallipot', label: 'gallipot' }, { to: 'catchword', label: 'catchword' }, { to: 'bookplate', label: 'bookplate' }, { to: 'cartouche', label: 'cartouche' }, { to: 'fillet', label: 'fillet' }] },
];

export default function Navbar() {
  const { user, signOut } = useAuth();
  const { route, navigate } = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const go = (to: Route) => {
    navigate(to);
    setOpen(false);
  };

  return (
    <nav className="fixed top-0 inset-x-0 z-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mt-3 flex items-center justify-between rounded-2xl glass px-3 py-2 sm:px-4">
          <button onClick={() => go('home')} className="text-sm font-semibold tracking-tight">rankvault</button>
          <div className="hidden md:flex items-center gap-1 text-sm">
            {primary.slice(0, 8).map((item) => (
              <button key={item.to} onClick={() => go(item.to)} className={`px-3 py-1.5 rounded-full transition ${route === item.to ? 'bg-white text-black' : 'text-neutral-300 hover:text-white hover:bg-white/10'}`}>
                {item.label}
              </button>
            ))}
            <div className="relative" ref={ref}>
              <button onClick={() => setOpen((v) => !v)} className="px-3 py-1.5 rounded-full text-neutral-300 hover:text-white hover:bg-white/10 transition">more</button>
              {open && (
                <div className="absolute right-0 mt-2 w-[520px] max-h-[70vh] overflow-auto rounded-2xl glass p-2 shadow-2xl">
                  {groups.map((g) => (
                    <div key={g.title} className="mb-2">
                      <button className="w-full text-left px-3 py-2 text-xs uppercase tracking-wider text-neutral-500 flex justify-between">
                        {g.title} <span className="text-[10px]">{g.items.length}</span>
                      </button>
                      <div className="px-2 pb-2.5 grid grid-cols-2 sm:grid-cols-3 gap-0.5">
                        {g.items.map((l, i) => (
                          <button key={`${g.title}-${l.to}-${i}`} onClick={() => go(l.to)} className="text-left text-[13px] text-neutral-400 hover:text-white hover:bg-white/5 rounded-xl px-2.5 py-2">{l.label}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <button onClick={signOut} className="text-xs text-neutral-400 hover:text-white">sign out</button>
            ) : (
              <button onClick={() => go('vault')} className="text-xs px-3 py-1.5 rounded-full bg-white text-black font-medium">open vault</button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
