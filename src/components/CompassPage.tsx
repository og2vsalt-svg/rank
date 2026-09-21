import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter, type Route } from './Router';

const desks: { to: Route; label: string; hint: string }[] = [
  { to: 'vault', label: 'vault', hint: 'private files' },
  { to: 'drop', label: 'drop', hint: 'public file share' },
  { to: 'transfer', label: 'transfer', hint: 'peer send' },
  { to: 'share', label: 'share', hint: 'open a drop id' },
  { to: 'notes', label: 'notes', hint: 'scratch pad' },
  { to: 'paste', label: 'paste', hint: 'text drops' },
  { to: 'zip', label: 'zip', hint: 'pack files' },
  { to: 'gallery', label: 'gallery', hint: 'image desk' },
  { to: 'inspect', label: 'inspect', hint: 'file metadata' },
  { to: 'drift', label: 'drift', hint: 'local wall' },
  { to: 'keep', label: 'keep', hint: 'bookmarks' },
];

export default function CompassPage() {
  const { navigate } = useRouter();
  const [q, setQ] = useState('');
  const hits = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return desks;
    return desks.filter((d) => d.label.includes(n) || d.hint.includes(n));
  }, [q]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5">
        <div className="max-w-xl mx-auto">
          <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-3">compass</p>
          <h1 className="text-3xl font-semibold text-white tracking-tight">find a desk</h1>
          <p className="text-sm text-neutral-500 mt-2 mb-8">jump across tools without hunting the menu.</p>
          <motion.input
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="search desks"
            className="w-full glass rounded-full px-5 py-3 text-sm text-white outline-none"
          />
          <ul className="mt-6 space-y-2">
            {hits.map((d) => (
              <li key={d.to}>
                <button
                  onClick={() => navigate(d.to)}
                  className="w-full text-left glass rounded-2xl px-4 py-3 flex items-center justify-between"
                >
                  <span className="text-sm text-white">{d.label}</span>
                  <span className="text-xs text-neutral-500">{d.hint}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
