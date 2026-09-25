import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

export default function QuiltPage() {
  const { navigate } = useRouter();
  const [rows, setRows] = useState<CloudMeta[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    let dead = false;
    listPublicShares(36).then((list) => {
      if (!dead) {
        setRows(list);
        setBusy(false);
      }
    });
    return () => {
      dead = true;
    };
  }, []);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm mb-2">quilt</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">public drops, stitched.</h1>
          <p className="text-neutral-400 text-sm mb-8 max-w-xl">not another vault. just a living board of whatever people already published. tap a tile to open the share.</p>
          {busy && <p className="text-sm text-neutral-500">pulling the board…</p>}
          {!busy && !rows.length && <p className="text-sm text-neutral-500">quiet right now. drop something public and it shows here.</p>}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {rows.map((row, i) => (
              <motion.button
                key={row.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.4), duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => navigate('share', row.id)}
                className="text-left glass rounded-3xl overflow-hidden hover:scale-[1.015] transition-transform duration-300"
              >
                <div className="aspect-[4/3] bg-white/5">
                  {String(row.type || '').startsWith('image/') && row.url ? (
                    <img src={row.url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-neutral-500 px-3 text-center">{row.type || 'file'}</div>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-sm text-white truncate">{row.name}</p>
                  <p className="text-[11px] text-neutral-500 mt-1">{pretty(row.size)} · {shareUrls(row.id).embed.replace(/^https?:\/\//, '')}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
