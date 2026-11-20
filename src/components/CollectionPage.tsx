import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, type CloudMeta } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function CollectionPage() {
  const { navigate } = useRouter();
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await listPublicShares(48);
      if (!cancelled) {
        setShares(list);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return shares.filter((share) => {
      const matchesQ = !s || (share.name || '').toLowerCase().includes(s) || (share.caption || '').toLowerCase().includes(s);
      const matchesType = typeFilter === 'all' || (share.type || '').startsWith(typeFilter);
      return matchesQ && matchesType;
    });
  }, [shares, q, typeFilter]);

  const types = useMemo(() => {
    const set = new Set(shares.map((s) => (s.type || '').split('/')[0] || 'other'));
    return ['all', ...Array.from(set).filter(Boolean)];
  }, [shares]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 20 }}
        >
          <p className="text-[#0A84FF] text-sm font-medium mb-2 tracking-wide">collection</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">Browse the vault.</h1>
          <p className="text-neutral-400 text-sm mb-8 max-w-xl leading-relaxed">
            Search and filter recent public shares. Soft size warnings only. Every link carries a polished Discord embed. Apple-style springs on frosted glass.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="search names or captions…"
              className="flex-1 bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/25"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/25"
            >
              {types.map((t) => (
                <option key={t} value={t}>{t === 'all' ? 'all types' : t}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <p className="text-neutral-500 text-sm">loading the collection…</p>
          ) : filtered.length === 0 ? (
            <p className="text-neutral-500 text-sm">nothing matches. try a different search.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((share, i) => (
                <motion.button
                  key={share.id}
                  onClick={() => navigate('share', share.id)}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.4), type: 'spring', stiffness: 180, damping: 22 }}
                  whileHover={{ y: -4 }}
                  className="glass rounded-2xl p-4 text-left hover:bg-white/[0.07] transition apple-card"
                >
                  {share.type?.startsWith('image/') && share.url ? (
                    <img src={share.url} alt="" className="w-full h-36 object-cover rounded-xl mb-3" />
                  ) : (
                    <div className="w-full h-36 rounded-xl bg-white/5 grid place-items-center text-xs text-neutral-500 mb-3">
                      {share.type?.split('/')[0] || 'file'}
                    </div>
                  )}
                  <p className="text-sm font-medium truncate">{share.name}</p>
                  <p className="text-xs text-neutral-500 truncate mt-0.5">{share.caption || 'shared via rankvault'}</p>
                  <p className="text-[11px] text-neutral-600 mt-1">{(share.size / 1024 / 1024).toFixed(1)} MB</p>
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
