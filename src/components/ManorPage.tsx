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

export default function ManorPage() {
  const { navigate } = useRouter();
  const [rows, setRows] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    let cancel = false;
    (async () => {
      const list = await listPublicShares(48);
      if (!cancel) {
        setRows(list);
        setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  const shown = rows.filter((r) => r.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm mb-2">manor</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">public drops</h1>
          <p className="text-sm text-neutral-500 mb-8 max-w-xl">live files sitting in the share table. no hard cap. huge ones just feel sleepy on slow tabs.</p>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="filter by name"
            className="w-full max-w-md mb-8 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none"
          />
          {loading ? (
            <p className="text-sm text-neutral-500">asking the database…</p>
          ) : shown.length === 0 ? (
            <p className="text-sm text-neutral-500">nothing public right now. drop something from vault or drop.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {shown.map((r) => (
                <button
                  key={r.id}
                  onClick={() => navigate('share', r.id)}
                  className="glass rounded-3xl p-5 text-left"
                >
                  <p className="text-sm font-medium truncate">{r.name}</p>
                  <p className="text-xs text-neutral-500 mt-1">{formatBytes(r.size)} · {r.type.split('/')[0] || 'file'}</p>
                  {r.size > 8 * 1024 * 1024 && <p className="text-[11px] text-amber-300/80 mt-2">large drop. preview may lag.</p>}
                  <p className="text-[11px] text-neutral-600 mt-3 truncate">{shareUrls(r.id).embed}</p>
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
