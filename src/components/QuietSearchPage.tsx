import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, type CloudMeta } from '../lib/cloudShare';
import { useRouter } from './Router';

function formatBytes(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function QuietSearchPage() {
  const { navigate } = useRouter();
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [q, setQ] = useState('');
  const [type, setType] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listPublicShares(48).then(setShares).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return shares.filter((sh) => {
      const matchQ = !s || (sh.name || '').toLowerCase().includes(s) || (sh.caption || '').toLowerCase().includes(s);
      const matchT = type === 'all' || (sh.type || '').startsWith(type);
      return matchQ && matchT;
    });
  }, [shares, q, type]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[36px] p-8 md:p-12 mb-8"
        >
          <p className="text-[#0A84FF] text-[13px] font-medium tracking-wide mb-2">Quiet Search</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">Discover shares.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-6">
            Browse recent public drops. Search by name or caption. Filter by type. Each opens with a polished Discord embed. Soft motion on frosted glass. No hard limits anywhere.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search names or captions…"
              className="flex-1 bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white focus:outline-none"
            >
              <option value="all">All types</option>
              <option value="image/">Images</option>
              <option value="video/">Videos</option>
              <option value="audio/">Audio</option>
              <option value="text/">Text</option>
            </select>
          </div>
        </motion.div>

        {loading ? (
          <p className="text-neutral-500 text-center">Loading public shares…</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <AnimatePresence>
              {filtered.map((sh, i) => (
                <motion.button
                  key={sh.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.03, type: 'spring', stiffness: 120, damping: 18 }}
                  onClick={() => navigate('share', sh.id)}
                  className="glass rounded-3xl p-5 text-left hover:bg-white/[0.03] transition"
                >
                  {sh.type?.startsWith('image/') && sh.url ? (
                    <img src={sh.url} alt="" className="w-full h-40 object-cover rounded-2xl mb-3" />
                  ) : (
                    <div className="w-full h-40 rounded-2xl bg-white/5 grid place-items-center text-neutral-500 text-sm mb-3">
                      {sh.type?.split('/')[0] || 'file'}
                    </div>
                  )}
                  <p className="text-sm font-medium truncate">{sh.name || 'untitled'}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{formatBytes(sh.size)} · {sh.type || 'file'}</p>
                  {sh.caption && <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{sh.caption}</p>}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        )}
        {!loading && !filtered.length && (
          <p className="text-neutral-500 text-center mt-8">No shares match. Try a different search.</p>
        )}
      </div>
    </div>
  );
}
