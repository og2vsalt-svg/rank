import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, type CloudMeta } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

export default function InsightsPage() {
  const [items, setItems] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listPublicShares(100).then((rows) => {
      setItems(rows);
      setLoading(false);
    });
  }, []);

  const byType = items.reduce((acc, item) => {
    const t = item.type.split('/')[0] || 'other';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalSize = items.reduce((s, i) => s + (i.size || 0), 0);
  const avgSize = items.length ? totalSize / items.length : 0;
  const totalDownloads = items.reduce((s, i) => s + (i.downloads || 0), 0);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-5 pb-24 pt-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="mb-10"
        >
          <p className="text-[12px] uppercase tracking-[0.2em] text-[#0A84FF]">insights</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em] text-white">quiet numbers</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-neutral-400">
            A calm view of recent public shares. Types, sizes, and arrivals. Soft size warnings only elsewhere. No hard limits. Apple-style springs on frosted glass. Discord embeds on every link.
          </p>
        </motion.div>

        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="glass rounded-2xl p-4">
            <p className="text-[11px] text-neutral-500">shares</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-white">{loading ? '—' : items.length}</p>
          </div>
          <div className="glass rounded-2xl p-4">
            <p className="text-[11px] text-neutral-500">total size</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-white">{loading ? '—' : pretty(totalSize)}</p>
          </div>
          <div className="glass rounded-2xl p-4">
            <p className="text-[11px] text-neutral-500">avg size</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-white">{loading ? '—' : pretty(avgSize)}</p>
          </div>
          <div className="glass rounded-2xl p-4">
            <p className="text-[11px] text-neutral-500">arrivals</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-white">{loading ? '—' : totalDownloads}</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-3xl p-6 mb-8"
        >
          <h2 className="text-lg font-semibold mb-4 text-white">by type</h2>
          {loading ? (
            <p className="text-sm text-neutral-500">listening…</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between text-sm">
                  <span className="text-neutral-300 capitalize">{type}</span>
                  <span className="text-neutral-500">{count}</span>
                </div>
              ))}
              {!Object.keys(byType).length && <p className="text-sm text-neutral-500">no shares yet</p>}
            </div>
          )}
        </motion.div>

        {!loading && items.length === 0 && (
          <p className="text-sm text-neutral-500">share something from any desk to see insights here.</p>
        )}
      </main>
    </div>
  );
}
