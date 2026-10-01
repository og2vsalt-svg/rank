import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

export default function TaffrailPage() {
  const [rows, setRows] = useState<CloudMeta[]>([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    listPublicShares(40).then(setRows).catch(() => setRows([]));
  }, []);

  const filtered = rows.filter((r) => !q || r.name.toLowerCase().includes(q.toLowerCase()) || (r.author || '').toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[28px] p-7">
          <p className="text-[#0a84ff] text-sm mb-2">taffrail</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">lean on the public rail.</h1>
          <p className="text-neutral-400 text-sm mb-6">read what already drifted into supabase. a viewing rail, not a filing cabinet. each row still carries a discord /s card.</p>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="filter the wake" className="w-full mb-5 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
          <div className="space-y-2">
            {filtered.length === 0 && <p className="text-sm text-neutral-500">the rail is quiet.</p>}
            {filtered.map((r, i) => (
              <motion.a
                key={r.id}
                href={shareUrls(r.id).embed}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 12) * 0.03, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="block rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3 hover:bg-white/[0.06] transition-colors"
              >
                <p className="text-sm text-white truncate">{r.name}</p>
                <p className="text-xs text-neutral-500 mt-1">{pretty(r.size)} · {r.type.split(';')[0]}{r.author ? ` · ${r.author}` : ''}</p>
              </motion.a>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
