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

export default function SpirePage() {
  const { navigate } = useRouter();
  const [rows, setRows] = useState<CloudMeta[] | null>(null);

  useEffect(() => {
    listPublicShares(40).then(setRows);
  }, []);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="text-[#0a84ff] text-sm mb-2">spire</p>
          <h1 className="text-3xl font-semibold tracking-tight">what is live on the public shelf.</h1>
          <p className="text-neutral-400 text-sm mt-2">not the vault. just recent public drops from the share db.</p>
        </motion.div>
        <div className="space-y-2">
          {(rows || []).map((r, i) => (
            <motion.button
              key={r.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.4), ease: [0.22, 1, 0.36, 1] }}
              onClick={() => navigate('share', r.id)}
              className="w-full text-left glass rounded-2xl px-5 py-4 hover:bg-white/5 transition"
            >
              <p className="text-sm text-white truncate">{r.name}</p>
              <p className="text-xs text-neutral-500 mt-1">{pretty(r.size)} · {r.type || 'file'} · {shareUrls(r.id).embed}</p>
            </motion.button>
          ))}
          {rows && rows.length === 0 && <p className="text-sm text-neutral-500">nothing public yet.</p>}
          {rows === null && <p className="text-sm text-neutral-500">looking…</p>}
        </div>
      </div>
    </div>
  );
}
