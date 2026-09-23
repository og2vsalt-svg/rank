import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Row = { name: string; type: string; size: number; warn: string | null };

function formatBytes(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

export default function SievePage() {
  const [rows, setRows] = useState<Row[]>([]);

  const onFiles = (list: FileList | null) => {
    if (!list?.length) return;
    setRows(
      [...list].map((f) => ({
        name: f.name,
        type: f.type || 'unknown',
        size: f.size,
        warn: f.size > 40 * 1024 * 1024 ? 'chunky. preview or encode may feel slow.' : null,
      })),
    );
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">sieve</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">peek files before you host them.</h1>
          <p className="text-neutral-400 text-sm mb-6">local only. no upload. just type, size, and a slowness hint if it is huge. no cap.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">drop files to inspect</p>
          </label>
          <div className="mt-6 space-y-2">
            {rows.map((r) => (
              <div key={r.name + r.size} className="rounded-2xl bg-white/[0.04] border border-white/8 px-4 py-3">
                <p className="text-sm text-white truncate">{r.name}</p>
                <p className="text-xs text-neutral-500">{formatBytes(r.size)} · {r.type}</p>
                {r.warn && <p className="text-xs text-amber-300/80 mt-1">{r.warn}</p>}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
