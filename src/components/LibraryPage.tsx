import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';

export default function LibraryPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'image' | 'video' | 'other'>('all');

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
      return !type.startsWith('image/') && !type.startsWith('video/');
    });
  }, [shares, query, filter]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 22 }}
        >
          <p className="text-[#0A84FF] text-sm font-medium tracking-wide mb-2">library</p>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white mb-3">Your public shares.</h1>
          <p className="text-neutral-400 text-base max-w-2xl mb-8 leading-relaxed">
            A calm place to browse everything that has been shared. Search, filter, and open any link. Soft size warnings only on the desks that create them. Polished Discord embeds on every share.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search names or notes…"
              className="flex-1 bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/25 transition"
            />
            <div className="flex gap-1.5 bg-black/30 rounded-2xl p-1 border border-white/10">
              {(['all', 'image', 'video', 'other'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-xl text-sm transition ${
                    filter === f ? 'bg-white/15 text-white' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {loading && <p className="text-neutral-500">opening library…</p>}

          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((s) => {
                const url = shareUrls(s.id).app;
                const isImg = (s.type || '').startsWith('image/');
                return (
                  <motion.a
                    key={s.id}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    whileHover={{ y: -6, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
                    className="glass rounded-3xl p-5 block border border-white/5 hover:border-white/15 transition"
                  >
                    {isImg && s.fileUrl ? (
                      <img src={s.fileUrl} alt="" className="w-full h-40 object-cover rounded-2xl mb-4" />
                    ) : (
                      <div className="w-full h-40 rounded-2xl bg-white/5 grid place-items-center text-neutral-500 text-sm mb-4">
                        {s.type?.split('/')[0] || 'file'}
                      </div>
                    )}
                    <p className="font-medium text-white truncate">{s.name || 'untitled'}</p>
                    <p className="text-sm text-neutral-400 mt-1 line-clamp-2">{s.caption || 'shared file'}</p>
                    <p className="text-xs text-neutral-500 mt-3">
                      {s.size ? `${(s.size / 1024 / 1024).toFixed(1)} MB` : ''} · {s.downloads || 0} views
                    </p>
                  </motion.a>
                );
              })}
            </div>
          </AnimatePresence>

          {!loading && filtered.length === 0 && (
            <p className="text-neutral-500 text-center mt-12">Nothing matches. Drop a file from any desk to see it here.</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
