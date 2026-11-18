import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, type CloudMeta } from '../lib/cloudShare';

function formatBytes(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function QuietLibraryPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'image' | 'video' | 'audio' | 'other'>('all');

  useEffect(() => {
    listPublicShares(48).then(setShares).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return shares.filter((s) => {
      const q = query.toLowerCase();
      const matchesQuery = !q || (s.name || '').toLowerCase().includes(q) || (s.caption || '').toLowerCase().includes(q);
      if (!matchesQuery) return false;
      if (filter === 'all') return true;
      const type = (s.type || '').toLowerCase();
      if (filter === 'image') return type.startsWith('image/');
      if (filter === 'video') return type.startsWith('video/');
      if (filter === 'audio') return type.startsWith('audio/');
      return !type.startsWith('image/') && !type.startsWith('video/') && !type.startsWith('audio/');
    });
  }, [shares, query, filter]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[36px] p-8 md:p-12 mb-8"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#0A84FF] mb-2">Quiet Library</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">Browse recent shares.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-6">
            A still gallery of public drops. Search by name or caption. Filter by type. Each opens with a polished Discord embed. Soft spring motion on frosted glass.
          </p>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search shares…"
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-4 focus:outline-none focus:border-white/30 transition"
          />
          <div className="flex flex-wrap gap-2">
            {(['all', 'image', 'video', 'audio', 'other'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-sm transition ${
                  filter === f ? 'bg-white text-black' : 'bg-white/5 text-neutral-300 hover:bg-white/10'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </motion.div>

        {loading ? (
          <p className="text-center text-neutral-500">opening the library…</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-neutral-500">nothing matches yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <AnimatePresence>
              {filtered.map((s) => (
                <motion.a
                  key={s.id}
                  href={`/s/${s.id}`}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="glass rounded-2xl p-5 block hover:bg-white/5 transition"
                >
                  {s.type?.startsWith('image/') && s.url ? (
                    <img src={s.url} alt="" className="w-full h-40 object-cover rounded-xl mb-3" />
                  ) : (
                    <div className="w-full h-40 rounded-xl bg-white/5 grid place-items-center text-neutral-500 text-sm mb-3">
                      {s.type?.split('/')[0] || 'file'}
                    </div>
                  )}
                  <p className="font-medium truncate">{s.name || 'untitled'}</p>
                  <p className="text-xs text-neutral-500 mt-1">{formatBytes(s.size)} · {s.caption || 'no caption'}</p>
                </motion.a>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
