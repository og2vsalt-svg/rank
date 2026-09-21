import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function formatBytes(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

export default function KilnPage() {
  const [rows, setRows] = useState<{ name: string; type: string; size: number; warn: string }[]>([]);

  const ingest = (files: FileList | null) => {
    if (!files) return;
    const next = Array.from(files).map((f) => ({
      name: f.name,
      type: f.type || 'unknown',
      size: f.size,
      warn: f.size > 40 * 1024 * 1024 ? 'this one is heavy. previews may hitch.' : '',
    }));
    setRows(next);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">kiln</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">weigh a pile before you host it.</h1>
          <p className="text-neutral-400 text-sm mb-6">local inspect only. no size cap, just a slowness note when files get chunky.</p>
          <label className="block rounded-2xl border border-dashed border-white/15 px-5 py-10 text-center text-sm text-neutral-400 cursor-pointer hover:border-white/30 transition-colors mb-6">
            drop a batch
            <input type="file" multiple className="hidden" onChange={(e) => ingest(e.target.files)} />
          </label>
          <ul className="space-y-2">
            {rows.map((r) => (
              <li key={r.name + r.size} className="flex items-start justify-between gap-3 rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3">
                <div>
                  <p className="text-sm text-white">{r.name}</p>
                  <p className="text-xs text-neutral-500">{r.type} · {formatBytes(r.size)}</p>
                  {r.warn && <p className="text-xs text-amber-400/80 mt-1">{r.warn}</p>}
                </div>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
