import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function HorizonPulsePage() {
  const { navigate } = useRouter();
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    let live = true;
    (async () => {
      const list = await listPublicShares(36);
      if (live) {
        setShares(list);
        setLoading(false);
      }
    })();
    return () => { live = false; };
  }, []);

  const filtered = shares.filter(s =>
    !filter ||
    (s.name || '').toLowerCase().includes(filter.toLowerCase()) ||
    (s.caption || '').toLowerCase().includes(filter.toLowerCase()) ||
    (s.type || '').toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7] font-sans antialiased">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          className="text-center mb-12"
        >
          <p className="text-[#0A84FF] text-sm tracking-wide mb-3">horizon pulse</p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight mb-4 leading-[1.02]">recent public shares.</h1>
          <p className="text-neutral-400 text-lg leading-relaxed">A living pulse of what has been shared. Soft size notes only. Every link ships with a polished Discord embed. Apple-style staggered springs on frosted glass.</p>
        </motion.div>

        <div className="max-w-md mx-auto mb-10">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="filter by name, caption, or type"
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3.5 text-base focus:outline-none focus:border-[#0A84FF]/50 transition"
          />
        </div>

        {loading ? (
          <div className="text-center text-neutral-500 py-20">listening…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-neutral-500 py-20">no shares yet. drop one from any desk.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filtered.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ delay: i * 0.03, type: 'spring', stiffness: 100, damping: 18 }}
                  className="glass rounded-3xl p-6 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium truncate">{s.name || 'untitled'}</p>
                    {s.color && <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }} />}
                  </div>
                  {s.caption && <p className="text-sm text-neutral-400 line-clamp-2">{s.caption}</p>}
                  <p className="text-xs text-neutral-500">{s.type || 'file'} · {(s.size / 1024 / 1024).toFixed(1)} MB</p>
                  <button
                    onClick={() => navigator.clipboard.writeText(shareUrls(s.id).embed)}
                    className="text-sm text-[#0A84FF] hover:underline"
                  >
                    copy link
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <button onClick={() => navigate('home')} className="mt-16 text-sm text-neutral-500 hover:text-white transition block mx-auto">← back home</button>
      </div>
    </div>
  );
}
