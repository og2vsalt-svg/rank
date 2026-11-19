import { useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useRouter, type Route } from './Router';

type NavItem = { to: Route; label: string };

const primary: NavItem[] = [
  { to: 'core', label: 'core' },
  { to: 'quietspark', label: 'spark' },
  { to: 'quietcollection', label: 'collection' },
  { to: 'quietlens', label: 'lens' },
  { to: 'quietdiary', label: 'diary' },
  { to: 'quietlibrary', label: 'library' },
  { to: 'quietcomposer', label: 'composer' },
  { to: 'quietsearch', label: 'search' },
  { to: 'quietstamp', label: 'stamp' },
  { to: 'quiethush', label: 'hush' },
  { to: 'quietbinder', label: 'binder' },
  { to: 'quietannotate', label: 'annotate' },
  { to: 'quiettimestamp', label: 'timestamp' },
  { to: 'quietchronicle', label: 'chronicle' },
  { to: 'quietsequence', label: 'sequence' },
  { to: 'quietstack', label: 'stack' },
  { to: 'quietvoid', label: 'void' },
  { to: 'quietpalette', label: 'palette' },
  { to: 'quietprism', label: 'prism' },
  { to: 'quietatlas', label: 'atlas' },
  { to: 'quietlattice', label: 'lattice' },
  { to: 'quietlumenveil', label: 'lumenveil' },
  { to: 'quietbridge', label: 'bridge' },
  { to: 'quietwhisper', label: 'whisper' },
  { to: 'quietsanctuary', label: 'sanctuary' },
  { to: 'nexus', label: 'nexus' },
  { to: 'quietstream', label: 'stream' },
  { to: 'quietforge', label: 'forge' },
  { to: 'studio', label: 'studio' },
  { to: 'quietcollage', label: 'collage' },
  { to: 'quietglow', label: 'glow' },
  { to: 'quietechoes', label: 'echoes' },
  { to: 'audiodesk', label: 'audio' },
  { to: 'qrdesk', label: 'qr' },
  { to: 'gallery', label: 'gallery' },
  { to: 'vault', label: 'vault' },
  { to: 'quietmoodboard', label: 'moodboard' },
  { to: 'quietxenon', label: 'xenon' },
  { to: 'quietgradient', label: 'gradient' },
  { to: 'quietsketch', label: 'sketch' },
  { to: 'quietquote', label: 'quote' },
  { to: 'quietmood', label: 'mood' },
  { to: 'quietcapsule', label: 'capsule' },
  { to: 'quietdrift', label: 'drift' },
  { to: 'directory', label: 'desks' },
];

export default function Navbar() {
  const { route, navigate } = useRouter();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const go = (to: Route) => {
    navigate(to);
    setOpen(false);
  };

  return (
    <nav className="fixed top-0 inset-x-0 z-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mt-3 flex items-center justify-between rounded-2xl glass px-3 py-2 sm:px-4">
          <button onClick={() => go('home')} className="text-sm font-semibold tracking-tight text-white">rankvault</button>
          <div className="hidden md:flex items-center gap-1 text-sm">
            {primary.map((item) => (
              <button key={item.to} onClick={() => go(item.to)} className={`px-3 py-1.5 rounded-full transition ${route === item.to ? 'bg-white text-black' : 'text-neutral-300 hover:text-white hover:bg-white/10'}`}>
                {item.label}
              </button>
            ))}
          </div>
          <div className="md:hidden" ref={ref}>
            <button onClick={() => setOpen((o) => !o)} className="px-3 py-1.5 text-sm rounded-full hover:bg-white/10">menu</button>
            {open && (
              <div className="absolute right-4 top-16 glass rounded-2xl p-2 w-44 max-h-80 overflow-auto">
                {primary.map((item) => (
                  <button key={item.to} onClick={() => go(item.to)} className={`block w-full text-left px-3 py-2 text-sm rounded-xl ${route === item.to ? 'bg-white text-black' : 'hover:bg-white/10'}`}>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
