import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, type CloudMeta } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

export default function GleanPage() {
  const [rows, setRows] = useState<CloudMeta[] | null>(null);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const glean = async () => {
    setBusy(true);
    setErr('');
    try {
      const list = await listPublicShares(48);
      setRows(list);
    } catch (e: any) {
      setErr(e?.message || 'could not glean');
    }
    setBusy(false);
  };

  const filtered = (rows || []).filter((r) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return (r.name || '').toLowerCase().includes(s) || (r.author || '').toLowerCase().includes(s) || (r.type || '').toLowerCase().includes(s);
  });

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[28px] p-7">
          <p className="text-[#0a84ff] text-sm mb-2">glean</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">walk the field of public drops.</h1>
          <p className="text-neutral-400 text-sm mb-6">this is a reading room, not a vault. we pull recent rows from the share database so you can skim names, sizes, and authors.</p>
          <div className="flex flex-wrap gap-2 mb-5">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="filter name, author, type" className="flex-1 min-w-[12rem] px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/40" />
            <button onClick={glean} disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">
              {busy ? 'gleaning…' : 'glean now'}
            </button>
          </div>
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          {rows && filtered.length === 0 && <p className="text-sm text-neutral-500">nothing left in the stubble.</p>}
          <ul className="space-y-2">
            {filtered.map((r) => (
              <li key={r.id} className="rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{r.name}</p>
                  <p className="text-[11px] text-neutral-500 truncate">{pretty(r.size)} · {r.type}{r.author ? ` · ${r.author}` : ''}</p>
                </div>
                <a href={`/s/${r.id}`} className="shrink-0 text-[13px] text-[#0a84ff]">open card</a>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
