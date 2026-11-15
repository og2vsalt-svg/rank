import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, type CloudMeta } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

export default function PulsePage() {
  const [items, setItems] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listPublicShares(48).then((rows) => {
      setItems(rows);
      setLoading(false);
    });
  }, []);

  const totalSize = items.reduce((s, i) => s + (i.size || 0), 0);
  const totalDownloads = items.reduce((s, i) => s + (i.downloads || 0), 0);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-5 pb-24 pt-12">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          className="mb-10"
        >
          <p className="text-[12px] uppercase tracking-[0.2em] text-white/35">pulse</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">quiet activity</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/50">
            A still pulse of recent public shares. Download counts and sizes sit quietly beside each card. Soft spring entry. Professional Discord embeds on every link. Soft size warnings only elsewhere. No hard limits. All prior desks remain fully intact.
          </p>
        </motion.div>

        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="glass rounded-2xl p-4">
            <p className="text-[11px] text-white/40">shares</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{loading ? '—' : items.length}</p>
          </div>
          <div className="glass rounded-2xl p-4">
            <p className="text-[11px] text-white/40">total size</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{loading ? '—' : pretty(totalSize)}</p>
          </div>
          <div className="glass rounded-2xl p-4">
            <p className="text-[11px] text-white/40">arrivals</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{loading ? '—' : totalDownloads}</p>
          </div>
        </div>

        {loading && <p className="text-sm text-white/40">listening…</p>}

        <div className="space-y-3">
          {items.map((item, i) => (
            <motion.a
              key={item.id}
              href={`/s/${item.id}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.025, 0.4), type: 'spring', stiffness: 110, damping: 16 }}
              className="glass group flex items-center gap-4 rounded-2xl p-4 transition-all hover:bg-white/[0.055]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-[11px] text-white/30">
                {item.type.startsWith('image/') ? 'img' : item.type.split('/')[0] || 'file'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium">{item.name || item.id}</p>
                <p className="mt-0.5 truncate text-[12px] text-white/40">{item.caption || 'no note'}</p>
              </div>
              <div className="shrink-0 text-right text-[12px] text-white/35">
                <p>{pretty(item.size)}</p>
                <p className="mt-0.5">{item.downloads || 0} arrivals</p>
              </div>
            </motion.a>
          ))}
        </div>

        {!loading && !items.length && (
          <p className="mt-8 text-sm text-white/40">the pulse is still. share something from any desk.</p>
        )}
      </main>
    </div>
  );
}
