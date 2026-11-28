import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function PulseGalleryPage() {
  const { navigate } = useRouter();
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'image' | 'video' | 'audio' | 'text'>('all');

  useEffect(() => {
    let live = true;
    (async () => {
      const list = await listPublicShares(48);
      if (live) {
        setShares(list);
        setLoading(false);
      }
    })();
    return () => { live = false; };
  }, []);

  const filtered = useMemo(() => {
    return shares.filter((s) => {
      const name = (s.name || '').toLowerCase();
      const caption = (s.caption || '').toLowerCase();
      const matchesQuery = !query || name.includes(query.toLowerCase()) || caption.includes(query.toLowerCase());
      const mime = (s.type || '').toLowerCase();
      let matchesFilter = true;
      if (filter === 'image') matchesFilter = mime.startsWith('image/');
      if (filter === 'video') matchesFilter = mime.startsWith('video/');
      if (filter === 'audio') matchesFilter = mime.startsWith('audio/');
      if (filter === 'text') matchesFilter = mime.includes('text') || mime.includes('markdown') || name.endsWith('.md');
      return matchesQuery && matchesFilter;
    });
  }, [shares, query, filter]);

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7] font-sans antialiased">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          className="text-center mb-12"
        >
          <p className="text-[#0A84FF] text-sm tracking-wide mb-3">pulse gallery</p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight mb-4 leading-[1.02]">living shares.</h1>
          <p className="text-neutral-400 text-lg leading-relaxed max-w-2xl mx-auto">A quiet explorer of recent public drops. Soft size notes only. Every link ships with a polished Discord embed. Apple-style springs on frosted glass.</p>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-4 mb-10 items-center justify-center">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="search names or captions"
            className="w-full sm:w-80 bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3 text-base focus:outline-none focus:border-[#0A84FF]/50 transition"
          />
          <div className="flex gap-2 flex-wrap justify-center">
            {(['all', 'image', 'video', 'audio', 'text'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full text-sm transition ${
                  filter === f ? 'bg-[#0A84FF] text-white' : 'bg-white/5 text-neutral-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center text-neutral-500">gathering recent drops…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-neutral-500 py-20">no shares match yet. drop something from any desk.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filtered.map((s, i) => {
                const urls = shareUrls(s.id);
                const isLarge = (s.size || 0) > 40 * 1024 * 1024;
                return (
                  <motion.a
                    key={s.id}
                    href={urls.embed}
                    target="_blank"
                    rel="noreferrer"
                    initial={{ opacity: 0, y: 24, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.94 }}
                    transition={{ type: 'spring', stiffness: 120, damping: 18, delay: i * 0.03 }}
                    className="glass rounded-3xl p-6 block hover:bg-white/[0.04] transition group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-medium text-lg leading-tight group-hover:text-[#0A84FF] transition line-clamp-2">{s.name || 'untitled'}</h3>
                      {s.color && <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1" style={{ background: s.color }} />}
                    </div>
                    {s.caption && <p className="text-sm text-neutral-400 mb-4 line-clamp-3">{s.caption}</p>}
                    <div className="flex items-center justify-between text-xs text-neutral-500">
                      <span>{s.type?.split('/')[0] || 'file'}</span>
                      <span>{((s.size || 0) / 1024 / 1024).toFixed(1)} MB</span>
                    </div>
                    {isLarge && <p className="text-[10px] text-amber-400 mt-2">large share · browser may feel slow</p>}
                    <p className="text-[10px] text-neutral-600 mt-3">discord-ready</p>
                  </motion.a>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        <button onClick={() => navigate('home')} className="mt-16 text-sm text-neutral-500 hover:text-white transition block mx-auto">← back home</button>
      </div>
    </div>
  );
}
