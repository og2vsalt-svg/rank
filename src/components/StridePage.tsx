import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

async function sha256(file: File) {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function StridePage() {
  const [rows, setRows] = useState<{ name: string; size: number; type: string; hash: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    setBusy(true);
    if ([...list].some((f) => f.size > 80 * 1024 * 1024)) setWarn('hashing a huge file locally can stall the tab. still no cap.');
    else setWarn('');
    const next = [];
    for (const f of [...list]) {
      let hash = 'skip';
      try {
        hash = await sha256(f);
      } catch {
        hash = 'could not hash';
      }
      next.push({ name: f.name, size: f.size, type: f.type || 'unknown', hash });
    }
    setRows(next);
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">stride</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">name, size, fingerprint.</h1>
          <p className="text-neutral-400 text-sm mb-6">local only. hashes stay in the tab. nothing uploaded unless you hop to nimbus after.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/40 p-8 text-center transition-all">
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'walking files…' : 'drop a pile to inspect'}</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          <div className="mt-6 space-y-2">
            {rows.map((r) => (
              <div key={r.hash + r.name} className="rounded-2xl bg-black/20 px-4 py-3">
                <p className="text-sm text-white">{r.name}</p>
                <p className="text-[11px] text-neutral-500 mt-1">{(r.size / 1024).toFixed(1)} kb · {r.type}</p>
                <p className="text-[11px] text-neutral-600 break-all mt-1">{r.hash}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
