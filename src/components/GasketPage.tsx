import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

async function sha(file: File) {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function GasketPage() {
  const [a, setA] = useState<{ name: string; hash: string; size: number } | null>(null);
  const [b, setB] = useState<{ name: string; hash: string; size: number } | null>(null);
  const [warn, setWarn] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async (which: 'a' | 'b', file?: File) => {
    if (!file) return;
    if (file.size > 80 * 1024 * 1024) setWarn('large file. hashing stays on device but can feel slow.');
    setBusy(true);
    try {
      const hash = await sha(file);
      const row = { name: file.name, hash, size: file.size };
      if (which === 'a') setA(row); else setB(row);
    } finally {
      setBusy(false);
    }
  };

  const match = a && b && a.hash === b.hash;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">gasket</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">do these two files seal.</h1>
          <p className="text-neutral-400 text-sm mb-6">sha-256 both sides in the browser. no upload, no size cap, just a slowness warning.</p>
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          <div className="grid sm:grid-cols-2 gap-3 mb-5">
            {(['a', 'b'] as const).map((side) => (
              <label key={side} className="rounded-2xl border border-dashed border-white/15 p-5 text-center cursor-pointer hover:border-[#0a84ff]/50">
                <input type="file" className="hidden" onChange={(e) => load(side, e.target.files?.[0])} />
                <p className="text-sm text-neutral-300 mb-1">file {side}</p>
                <p className="text-xs text-neutral-500 truncate">{(side === 'a' ? a : b)?.name || 'choose'}</p>
              </label>
            ))}
          </div>
          {busy && <p className="text-xs text-neutral-500 mb-3">hashing…</p>}
          {a && <p className="text-[11px] text-neutral-500 break-all mb-2">{a.hash}</p>}
          {b && <p className="text-[11px] text-neutral-500 break-all mb-4">{b.hash}</p>}
          {a && b && (
            <p className={`text-sm ${match ? 'text-emerald-300' : 'text-rose-300'}`}>{match ? 'same bytes.' : 'not the same file.'}</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
