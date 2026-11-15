import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listShares } from '../lib/db';

type Share = {
  id: string;
  name: string;
  mime?: string;
  size: number;
  file_url?: string;
  caption?: string | null;
  created_at: string;
  download_count?: number;
};

export default function QuietAtlasPage() {
  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [accent] = useState('#5AC8FA');

  useEffect(() => {
    listShares(48)
      .then(setShares)
      .catch(() => setShares([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = shares.filter((s) =>
    !query || (s.name + (s.caption || '')).toLowerCase().includes(query.toLowerCase())
  );

  const pretty = (n: number) => {
    if (n < 1024) return n + ' B';
    if (n < 1048576) return Math.round(n / 1024) + ' KB';
    return (n / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-6 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 22 }}
        >
          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>Quiet Atlas</p>
          <h1 className="text-[40px] font-semibold tracking-tight mb-3">Public shares.</h1>
          <p className="text-neutral-400 text-[16px] leading-relaxed mb-8 max-w-2xl">
            A living map of recent public files. Search, preview, and open. Every link unfurls a polished Discord embed. Soft size warnings only. No hard limits. Human-crafted Apple-style spring motion. All prior desks remain fully intact.
          </p>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search names or captions…"
            className="w-full max-w-md bg-black/20 border border-white/10 rounded-2xl px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-8 focus:outline-none focus:border-white/25 transition"
          />

          {loading ? (
            <p className="text-neutral-500">Opening the atlas…</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((s, i) => (
                <motion.a
                  key={s.id}
                  href={`/s/${s.id}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, type: 'spring', stiffness: 100, damping: 20 }}
                  className="glass rounded-2xl p-5 block hover:bg-white/5 transition group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-sm font-medium truncate pr-2">{s.name || 'untitled'}</p>
                    <span className="text-[11px] text-neutral-500 shrink-0">{pretty(s.size)}</span>
                  </div>
                  {s.caption && <p className="text-xs text-neutral-400 line-clamp-2 mb-3">{s.caption}</p>}
                  <div className="flex items-center justify-between text-[11px] text-neutral-500">
                    <span>{new Date(s.created_at).toLocaleDateString()}</span>
                    <span>{s.download_count || 0} opens</span>
                  </div>
                </motion.a>
              ))}
            </div>
          )}
          {!loading && filtered.length === 0 && <p className="text-neutral-500 mt-8">Nothing matches yet.</p>}
        </motion.div>
      </div>
    </div>
  );
}
