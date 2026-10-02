import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, type CloudMeta } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function ShelfPage() {
  const [rows, setRows] = useState<CloudMeta[]>([]);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => {
    listPublicShares(40).then(setRows).catch(() => setErr('shelf could not be read'));
  }, []);

  const shown = rows.filter((r) => !q || r.name.toLowerCase().includes(q.toLowerCase()) || (r.author || '').toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm font-medium mb-2">shelf</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-3">what already landed.</h1>
          <p className="text-neutral-400 max-w-xl mb-6">Public rows from the share table. Open one, or copy the Discord card. Nothing here is capped.</p>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="filter by name" className="mb-6 w-full sm:w-72 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
        </motion.div>
        {err && <p className="text-sm text-red-300">{err}</p>}
        <div className="grid sm:grid-cols-2 gap-3">
          {shown.map((row, i) => (
            <motion.a
              key={row.id}
              href={`${location.origin}/s/${row.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 8) * 0.04, duration: 0.35 }}
              className="glass rounded-3xl p-4 hover:-translate-y-0.5 transition"
            >
              <p className="text-white text-sm font-medium truncate">{row.name}</p>
              <p className="text-xs text-neutral-500 mt-1">{pretty(row.size)} · {row.type || 'file'}{row.author ? ` · ${row.author}` : ''}</p>
            </motion.a>
          ))}
        </div>
        {!shown.length && !err && <p className="text-sm text-neutral-500">nothing public yet. file a drop from vault, strake, or manifest.</p>}
      </main>
    </div>
  );
}
