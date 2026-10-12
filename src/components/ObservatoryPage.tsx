import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function ObservatoryPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    (async () => {
      const list = await listPublicShares(32);
      setShares(list);
      setLoading(false);
    })();
  }, []);

  const filtered = shares.filter((s) =>
    !filter || s.name.toLowerCase().includes(filter.toLowerCase()) || (s.caption || '').toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="mesh min-h-screen relative overflow-hidden">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="text-sm text-[#5E5CE6] mb-2 tracking-wide">observatory</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">watch the public sky.</h1>
          <p className="text-neutral-400 text-sm leading-relaxed max-w-xl">
            A quiet gallery of recent public shares. Each star is a file that landed in the database. Click to open the polished Discord embed link. No limits, only soft warnings elsewhere.
          </p>
        </motion.div>

        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="filter the sky by name or caption"
          className="w-full max-w-md mb-8 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none"
        />

        {loading ? (
          <p className="text-neutral-500 text-sm">opening the dome…</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filtered.map((s, i) => (
              <motion.a
                key={s.id}
                href={`/s/${s.id}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04, type: 'spring', stiffness: 120, damping: 14 }}
                whileHover={{ scale: 1.04, y: -4 }}
                className="glass rounded-2xl p-4 block relative overflow-hidden group"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity rounded-2xl" style={{ background: s.color || '#5E5CE6' }} />
                <p className="text-sm font-medium truncate relative z-10">{s.name}</p>
                {s.caption && <p className="text-xs text-neutral-500 mt-1 line-clamp-2 relative z-10">{s.caption}</p>}
                <p className="text-[10px] text-neutral-600 mt-2 relative z-10">{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : ''}</p>
              </motion.a>
            ))}
          </div>
        )}
        {filtered.length === 0 && !loading && <p className="text-neutral-500 text-sm mt-4">no stars match the filter.</p>}
      </div>
    </div>
  );
}
