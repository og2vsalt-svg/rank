import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';
import { useRouter } from './Router';

function formatBytes(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(2) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

export default function StreamPage() {
  const { navigate } = useRouter();
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const rows = await listPublicShares(36);
      if (!cancelled) {
        setShares(rows);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          <p className="text-[#0A84FF] text-sm font-medium mb-2 tracking-wide">public stream</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">recent drops</h1>
          <p className="text-neutral-400 text-base leading-relaxed max-w-xl">
            Files others have made public. Open any card, download, or share the Discord-ready link. Large files are handled; only a soft warning if something feels slow.
          </p>
        </motion.div>

        {loading ? (
          <p className="text-neutral-500 text-sm">gathering recent drops…</p>
        ) : shares.length === 0 ? (
          <div className="glass rounded-3xl p-10 text-center">
            <p className="text-neutral-400 mb-4">no public drops yet.</p>
            <button onClick={() => navigate('vault')} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">open the vault</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {shares.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="glass apple-card rounded-3xl p-5 flex flex-col"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{s.name || 'untitled'}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{formatBytes(s.size)} · {s.type?.split('/')[1] || 'file'}</p>
                  </div>
                  {s.downloads ? (
                    <span className="text-[10px] text-neutral-500 ml-2 shrink-0">{s.downloads}</span>
                  ) : null}
                </div>
                {s.caption && <p className="text-xs text-neutral-400 mb-4 line-clamp-2">{s.caption}</p>}
                <div className="mt-auto flex gap-2">
                  <button
                    onClick={() => navigate('share', s.id)}
                    className="flex-1 px-3 py-2 rounded-full bg-white text-black text-xs font-medium"
                  >
                    open
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(shareUrls(s.id).embed)}
                    className="px-3 py-2 rounded-full bg-white/10 text-xs"
                  >
                    copy link
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
