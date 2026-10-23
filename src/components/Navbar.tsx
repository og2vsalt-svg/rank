import { useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useRouter, type Route } from './Router';

type NavItem = { to: Route; label: string };

const primary: NavItem[] = [
  { to: 'softlumenflow', label: 'softlumenflow' },
  { to: 'softharbor', label: 'softharbor' },
  { to: 'softfalls', label: 'softfalls' },
  { to: 'softarchive', label: 'softarchive' },
  { to: 'softcandle', label: 'softcandle' },
  { to: 'quietmosaic', label: 'quietmosaic' },
  { to: 'softlumenveil', label: 'softlumenveil' },
  { to: 'softconstellation', label: 'softconstellation' },
  { to: 'softember', label: 'softember' },
  { to: 'quietglow', label: 'quietglow' },
  { to: 'quietnebula', label: 'quietnebula' },
  { to: 'softlantern', label: 'softlantern' },
  { to: 'chronicle', label: 'chronicle' },
  { to: 'softhalo', label: 'softhalo' },
  { to: 'softlumenhearth', label: 'softlumenhearth' },
  { to: 'softripple', label: 'softripple' },
  { to: 'softecho', label: 'softecho' },
  { to: 'softlumenorb', label: 'softlumenorb' },
  { to: 'softcascade', label: 'softcascade' },
  { to: 'auroraweave', label: 'auroraweave' },
  { to: 'softpetal', label: 'softpetal' },
  { to: 'lumenrain', label: 'lumenrain' },
  { to: 'softlumenfall', label: 'softlumenfall' },
  { to: 'prismvault', label: 'prismvault' },
  { to: 'quietfolio', label: 'quietfolio' },
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
          <button onClick={() => go('home')} className="text-sm font-semibold tracking-tight">rankvault</button>
          <div className="hidden md:flex items-center gap-1 text-sm overflow-x-auto">
            {primary.map((item) => (
              <button key={item.to} onClick={() => go(item.to)} className={`px-3 py-1.5 rounded-full transition whitespace-nowrap ${route === item.to ? 'bg-white text-black' : 'text-neutral-300 hover:text-white hover:bg-white/10'}`}>
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <button onClick={signOut} className="text-xs text-neutral-400 hover:text-white px-2">out</button>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}
