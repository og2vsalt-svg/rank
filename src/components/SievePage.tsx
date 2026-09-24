import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Row = {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  sha?: string;
  warn?: string;
};

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

async function sha256(file: File) {
  if (!crypto?.subtle) return undefined;
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function SievePage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    setBusy(true);
    const next: Row[] = [];
    for (const file of [...list]) {
      const warn = file.size > 40 * 1024 * 1024 ? 'chunky file. hashing may take a sec.' : undefined;
      let sha: string | undefined;
      try {
        sha = await sha256(file);
      } catch {
        sha = undefined;
      }
      next.push({
        name: file.name,
        size: file.size,
        type: file.type || 'unknown',
        lastModified: file.lastModified,
        sha,
        warn,
      });
    }
    setRows(next);
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">sieve</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">inspect a file. stay local.</h1>
          <p className="text-neutral-400 text-sm mb-6">name, size, type, and sha-256. nothing leaves the tab. not a vault, just a check.</p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition-all duration-300"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onFiles(e.dataTransfer.files);
            }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'reading…' : 'drop files to sift'}</p>
            <p className="text-xs text-neutral-500 mt-2">no upload cap. big ones just feel slower.</p>
          </label>
          <div className="mt-6 space-y-2">
            {rows.map((r) => (
              <div key={r.name + r.size} className="rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white truncate">{r.name}</p>
                  <span className="text-[11px] text-neutral-500 shrink-0">{pretty(r.size)}</span>
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">{r.type || 'unknown'} · {new Date(r.lastModified).toLocaleString()}</p>
                {r.sha && <p className="text-[11px] text-neutral-400 mt-1 break-all font-mono">{r.sha}</p>}
                {r.warn && <p className="text-[11px] text-amber-300/80 mt-1">{r.warn}</p>}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
