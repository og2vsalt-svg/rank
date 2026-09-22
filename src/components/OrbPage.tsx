import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';

function formatBytes(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

export default function OrbPage() {
  const { navigate } = useRouter();
  const [rows, setRows] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const list = await listPublicShares(18);
      if (!cancel) {
        setRows(list);
        setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-[#0a84ff] text-sm mb-2">orb</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">recent public drops.</h1>
          <p className="text-neutral-400 text-sm mb-8">live board from the share db. locked or expired rows stay out. copy the embed if you want the discord card.</p>
          {loading && <p className="text-sm text-neutral-500">listening…</p>}
          {!loading && rows.length === 0 && <p className="text-sm text-neutral-500">quiet right now. drop something from gully or cairn.</p>}
          <div className="grid gap-3">
            {rows.map((r) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-4 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{r.name}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{formatBytes(r.size)} · {r.type || 'file'}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => navigator.clipboard.writeText(shareUrls(r.id).embed)} className="px-3 py-1.5 rounded-full bg-white/8 text-xs">copy embed</button>
                  <button onClick={() => navigate('share', r.id)} className="px-3 py-1.5 rounded-full bg-white text-black text-xs font-medium">open</button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
