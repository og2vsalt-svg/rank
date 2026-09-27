import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Row = { name: string; size: number; type: string; last: number };

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

export default function CinderboxPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState('');

  const add = (list: FileList | null) => {
    if (!list) return;
    const next: Row[] = [];
    for (const f of Array.from(list)) {
      next.push({ name: f.name, size: f.size, type: f.type || 'unknown', last: f.lastModified });
    }
    setRows((prev) => [...next, ...prev].slice(0, 200));
  };

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(t) || r.type.toLowerCase().includes(t));
  }, [rows, q]);

  const total = rows.reduce((a, r) => a + r.size, 0);
  const warn = total > 200 * 1024 * 1024 ? 'this pile is heavy. the tab may feel slow if you try to publish all of it later.' : '';

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">cinderbox</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a local catalog. nothing leaves.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            names, types, sizes. no upload. use this before you pick what actually goes public.
          </p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 p-8 text-center mb-4">
            <input type="file" multiple className="hidden" onChange={(e) => add(e.target.files)} />
            <p className="text-white font-medium">add local files</p>
          </label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="filter"
            className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none mb-4"
          />
          <p className="text-xs text-neutral-500 mb-3">{rows.length} files · {pretty(total)}</p>
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {shown.map((r, i) => (
              <div key={i} className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl hover:bg-white/5">
                <p className="text-sm text-white truncate">{r.name}</p>
                <p className="text-[11px] text-neutral-500 shrink-0">{pretty(r.size)}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
