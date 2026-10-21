import { useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useRouter, type Route } from './Router';

type NavItem = { to: Route; label: string };

const primary: NavItem[] = [
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
  { to: 'softashfall', label: 'softashfall' },
  { to: 'softcinder', label: 'softcinder' },
  { to: 'softwhisper', label: 'softwhisper' },
  { to: 'quietharbor', label: 'quietharbor' },
  { to: 'softascent', label: 'softascent' },
  { to: 'softmosaic', label: 'softmosaic' },
  { to: 'quietcapsule', label: 'quietcapsule' },
  { to: 'lumenboard', label: 'lumenboard' },
  { to: 'quietnotes', label: 'quietnotes' },
  { to: 'sharetimeline', label: 'sharetimeline' },
  { to: 'softdrift', label: 'softdrift' },
  { to: 'softvortex', label: 'softvortex' },
  { to: 'softeddy', label: 'softeddy' },
  { to: 'softhelix', label: 'softhelix' },
  { to: 'softmirror', label: 'softmirror' },
  { to: 'softcanopy', label: 'softcanopy' },
  { to: 'softboard', label: 'softboard' },
  { to: 'softcrystal', label: 'softcrystal' },
  { to: 'softbreeze', label: 'softbreeze' },
  { to: 'softstream', label: 'softstream' },
  { to: 'softlantern', label: 'softlantern' },
  { to: 'quietmeadow', label: 'quietmeadow' },
  { to: 'softfirefly', label: 'softfirefly' },
  { to: 'softbreath', label: 'softbreath' },
  { to: 'softgarden', label: 'softgarden' },
  { to: 'softaurora', label: 'softaurora' },
  { to: 'starfield', label: 'starfield' },
  { to: 'softlattice', label: 'softlattice' },
  { to: 'softhorizon', label: 'softhorizon' },
  { to: 'softnebula', label: 'softnebula' },
  { to: 'softconstellation', label: 'softconstellation' },
  { to: 'softglowfield', label: 'softglowfield' },
  { to: 'velvetcurrent', label: 'velvetcurrent' },
  { to: 'silkglow', label: 'silkglow' },
  { to: 'softpulse', label: 'softpulse' },
  { to: 'softorbit', label: 'softorbit' },
  { to: 'velvetdusk', label: 'velvetdusk' },
  { to: 'prismglass', label: 'prismglass' },
  { to: 'softwhisp', label: 'softwhisp' },
  { to: 'lumenbreath', label: 'lumenbreath' },
  { to: 'quietmosaic', label: 'quietmosaic' },
  { to: 'lumenweave', label: 'lumenweave' },
  { to: 'glowveil', label: 'glowveil' },
  { to: 'starveil', label: 'starveil' },
];

const groups = [
  {
    title: 'light desks',
    items: [
      { to: 'softripple' as Route, label: 'softripple' },
      { to: 'softecho' as Route, label: 'softecho' },
      { to: 'softlumenorb' as Route, label: 'softlumenorb' },
      { to: 'softcascade' as Route, label: 'softcascade' },
      { to: 'lumendrift' as Route, label: 'lumendrift' },
      { to: 'softflare' as Route, label: 'softflare' },
      { to: 'quietbeam' as Route, label: 'quietbeam' },
      { to: 'softwave' as Route, label: 'softwave' },
    ],
  },
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
          <div className="hidden md:flex items-center gap-1 text-sm">
            {primary.map((item) => (
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
                      <p className="px-2 py-1 text-[10px] uppercase tracking-wider text-neutral-500">{g.title}</p>
                      <div className="grid grid-cols-3 gap-1">
                        {g.items.map((item) => (
                          <button key={item.to} onClick={() => go(item.to)} className={`text-left px-2 py-1.5 rounded-xl text-xs ${route === item.to ? 'bg-white text-black' : 'text-neutral-300 hover:bg-white/10'}`}>
                            {item.label}
                          </button>
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
              <button onClick={signOut} className="text-xs text-neutral-400 hover:text-white px-2">out</button>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}
