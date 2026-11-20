import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, type CloudMeta } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' KB';
  return (n / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function CalmLinePage() {
  const [items, setItems] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listPublicShares(32).then((rows) => {
      setItems(rows);
      setLoading(false);
    });
  }, []);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-28 pt-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 22 }}
          className="mb-12 text-center"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#5AC8FA] mb-3">calm line</p>
          <h1 className="text-4xl font-semibold tracking-tight">recent quiet shares</h1>
          <p className="mt-4 text-[15px] leading-relaxed text-neutral-400">
            A still line of public drops. Soft Apple-style springs, frosted glass, polished Discord embeds on every link. Soft size warnings only. No hard limits. Every prior desk stays intact.
          </p>
        </motion.div>

        {loading && <p className="text-center text-sm text-neutral-500">listening along the line…</p>}

        <div className="space-y-3">
          {items.map((item, i) => (
            <motion.a
              key={item.id}
              href={`/s/${item.id}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.025, 0.4), type: 'spring', stiffness: 140, damping: 20 }}
              whileHover={{ scale: 1.005 }}
              className="glass flex items-center gap-4 rounded-2xl p-4"
            >
              <div className="h-12 w-12 shrink-0 rounded-xl bg-white/5 grid place-items-center text-[10px] text-neutral-500">
                {item.type.startsWith('image/') ? 'img' : 'file'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.name || item.id}</p>
                <p className="text-xs text-neutral-500 truncate">{item.caption || 'shared'}</p>
              </div>
              <div className="text-right text-xs text-neutral-500">
                <p>{pretty(item.size)}</p>
                <p>{item.downloads || 0}</p>
              </div>
            </motion.a>
          ))}
        </div>

        {!loading && items.length === 0 && (
          <p className="text-center text-sm text-neutral-500 mt-10">the line is empty. drop a file from Core.</p>
        )}
      </main>
    </div>
  );
}
