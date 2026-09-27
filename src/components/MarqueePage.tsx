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

export default function MarqueePage() {
  const { navigate } = useRouter();
  const [rows, setRows] = useState<CloudMeta[] | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    listPublicShares(36)
      .then(setRows)
      .catch((e) => setErr(e?.message || 'could not load feed'));
  }, []);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-[#0a84ff] text-sm mb-2">marquee</p>
          <h1 className="text-3xl font-semibold mb-3">public drops walking by.</h1>
          <p className="text-neutral-400 text-sm mb-8">live feed from the cloud table. locked files still show a name, not the bytes.</p>
        </motion.div>
        {err && <p className="text-sm text-red-400">{err}</p>}
        {!rows && <p className="text-sm text-neutral-500">pulling the board…</p>}
        <div className="grid sm:grid-cols-2 gap-3">
          {(rows || []).map((r, i) => (
            <motion.button
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.4) }}
              onClick={() => navigate('share', r.id)}
              className="glass rounded-[24px] p-5 text-left"
            >
              <p className="font-medium truncate">{r.name}</p>
              <p className="text-xs text-neutral-500 mt-1">
                {pretty(r.size)} · {r.type.split(';')[0]} · {r.downloads || 0} opens
              </p>
              <p className="text-[11px] text-neutral-600 mt-3 truncate">{shareUrls(r.id).embed}</p>
            </motion.button>
          ))}
        </div>
        {rows && rows.length === 0 && <p className="text-sm text-neutral-500">nothing public yet. drop one first.</p>}
      </div>
    </div>
  );
}
