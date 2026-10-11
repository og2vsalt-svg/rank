import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { listPublicShares, type CloudMeta } from '../lib/cloudShare';

function formatBytes(n: number) {
  if (!n) return 'unknown';
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(2) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

function timeAgo(iso?: string) {
  if (!iso) return '';
  const diff = Date.now() - +new Date(iso);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  const d = Math.floor(h / 24);
  return d + 'd ago';
}

export default function GlimmerPage() {
  const { navigate } = useRouter();
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await listPublicShares(42);
      if (!cancelled) {
        setShares(list);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 88, damping: 17 }}
          className="mb-12 text-center"
        >
          <p className="text-[#0A84FF] text-sm font-medium mb-2 tracking-wide">glimmer</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-4">a soft light on recent shares.</h1>
          <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
            Public drops from the database, each with a professional Discord embed. No hard size limits — only a quiet note if something large might feel slow.
          </p>
        </motion.div>

        {loading ? (
          <p className="text-neutral-500 text-sm text-center">catching the light…</p>
        ) : shares.length === 0 ? (
          <div className="glass rounded-3xl p-10 text-center max-w-md mx-auto">
            <p className="text-neutral-400 mb-4">no glimmer yet.</p>
            <button onClick={() => navigate('drop')} className="px-5 py-2.5 rounded-full bg-[#0A84FF] text-white text-sm font-medium">drop a file</button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {shares.map((s, i) => (
              <motion.button
                key={s.id}
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: i * 0.025, type: 'spring', stiffness: 125, damping: 16 }}
                whileHover={{ y: -6, scale: 1.015 }}
                whileTap={{ scale: 0.975 }}
                onClick={() => navigate('share', s.id)}
                className="apple-card glass rounded-[30px] p-5 text-left group relative"
              >
                <p className="text-[11px] text-neutral-500 mb-2">{timeAgo(s.createdAt)} · {formatBytes(s.size)}</p>
                <h2 className="font-medium text-white truncate mb-2 group-hover:text-[#0A84FF] transition-colors">{s.name || 'untitled'}</h2>
                {s.caption && <p className="text-xs text-neutral-400 line-clamp-3">{s.caption}</p>}
                {s.size > 40 * 1024 * 1024 && <p className="text-[10px] text-amber-300/70 mt-2">may feel slow</p>}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
