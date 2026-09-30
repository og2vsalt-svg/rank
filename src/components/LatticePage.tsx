import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

const tiles = [
  { href: '#causeway', label: 'causeway', hint: 'one local file into the db' },
  { href: '#vestibule', label: 'vestibule', hint: 'inspect, then publish' },
  { href: '#echo', label: 'echo', hint: 'a note with a hash' },
  { href: '#drift', label: 'drift', hint: 'expiry clock' },
  { href: '#porch', label: 'porch', hint: 'discord card preview' },
  { href: '#gazette', label: 'gazette', hint: 'recent public drops' },
  { href: '#vault', label: 'vault', hint: 'private keep' },
  { href: '#drop', label: 'drop', hint: 'quick public send' },
];

export default function LatticePage() {
  const [q, setQ] = useState('');
  const shown = useMemo(
    () => tiles.filter((t) => (t.label + ' ' + t.hint).toLowerCase().includes(q.trim().toLowerCase())),
    [q],
  );

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm mb-2">lattice</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a map of desks that are not the vault.</h1>
          <p className="text-neutral-400 text-sm mb-6">hop between file hosting tools without hunting the menu.</p>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="filter desks"
            className="w-full max-w-md mb-6 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/40"
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {shown.map((t) => (
              <a
                key={t.href}
                href={t.href}
                className="glass rounded-3xl p-5 hover:bg-white/[0.06] transition-colors duration-300"
              >
                <p className="text-white font-medium">{t.label}</p>
                <p className="text-xs text-neutral-500 mt-1">{t.hint}</p>
              </a>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
