import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

async function sha256(file: File) {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

export default function PebblePage() {
  const [rows, setRows] = useState<{ name: string; size: number; hash: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const files = [...list];
    const big = files.some((f) => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'big files hash fine, just might feel slow in this tab. no cap.' : '');
    setBusy(true);
    try {
      const next = [];
      for (const f of files) {
        next.push({ name: f.name, size: f.size, hash: await sha256(f) });
      }
      setRows(next);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">pebble</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">hash a drop locally.</h1>
          <p className="text-neutral-400 text-sm mb-6">sha-256 stays in your browser. nothing uploads. useful before you publish a share.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition-all duration-300">
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'hashing…' : 'drop files to fingerprint'}</p>
            <p className="text-xs text-neutral-500 mt-2">no size limit. just a slowness warning.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          <div className="mt-6 space-y-3">
            {rows.map((r) => (
              <div key={r.hash} className="rounded-2xl bg-white/[0.03] border border-white/5 p-4">
                <p className="text-sm text-white truncate">{r.name}</p>
                <p className="text-xs text-neutral-500 mt-1">{pretty(r.size)}</p>
                <p className="text-[11px] text-neutral-400 break-all mt-2 font-mono">{r.hash}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
