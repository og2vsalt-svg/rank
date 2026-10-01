import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';
import { useRouter } from './Router';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

export default function NewelPage() {
  const { navigate } = useRouter();
  const [rows, setRows] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const list = await listPublicShares(36);
        setRows(list.filter((r) => !r.lockPass));
      } catch {
        setErr('could not read the public stair.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm mb-2">newel</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">the public stair.</h1>
          <p className="text-neutral-400 text-sm mb-8">unlocked drops from the share db, newest first. locked ones stay off this rail.</p>
          {loading && <p className="text-sm text-neutral-500">reading the post\u2026</p>}
          {err && <p className="text-sm text-red-400">{err}</p>}
          <div className="space-y-3">
            {rows.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 10) * 0.03, duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-3xl p-5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-white font-medium truncate">{r.name}</p>
                  <p className="text-xs text-neutral-500 mt-1">{pretty(r.size)} \u00b7 {r.type.split(';')[0]}{r.author ? ' \u00b7 ' + r.author : ''}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => navigate('share', r.id)} className="px-4 py-2 rounded-full bg-white text-black text-xs font-medium">open</button>
                  <button onClick={() => navigator.clipboard.writeText(shareUrls(r.id).embed)} className="px-4 py-2 rounded-full bg-white/5 text-xs">copy /s</button>
                </div>
              </motion.div>
            ))}
          </div>
          {!loading && !rows.length && <p className="text-sm text-neutral-500">no unlocked drops yet.</p>}
        </motion.div>
      </div>
    </div>
  );
}
