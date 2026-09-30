import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, type CloudMeta } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

export default function ThwartPage() {
  const [rows, setRows] = useState<CloudMeta[]>([]);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    listPublicShares(48).then((list) => {
      setRows(list);
      setBusy(false);
    });
  }, []);

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => (r.name || '').toLowerCase().includes(s) || (r.author || '').toLowerCase().includes(s));
  }, [rows, q]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[28px] p-7">
          <p className="text-[#0a84ff] text-sm mb-2">thwart</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">sit across the public bench and look.</h1>
          <p className="text-neutral-400 text-sm mb-6">not a vault. a live reading of public shares already in the database. copy the discord card for any row.</p>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="filter by name or author" className="w-full mb-5 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
          {busy && <p className="text-sm text-neutral-500">listening…</p>}
          <ul className="space-y-2">
            {shown.map((r) => (
              <li key={r.id} className="rounded-2xl bg-black/20 border border-white/5 px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-neutral-200 truncate">{r.name}</p>
                  <p className="text-xs text-neutral-500">{pretty(r.size)} · {r.author || 'anon'} · {r.downloads || 0} opens</p>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/s/${r.id}`)}
                  className="shrink-0 px-3 py-1.5 rounded-full bg-white text-black text-xs font-medium"
                >
                  copy /s
                </button>
              </li>
            ))}
          </ul>
          {!busy && !shown.length && <p className="text-sm text-neutral-500">bench is empty right now.</p>}
        </motion.div>
      </div>
    </div>
  );
}
