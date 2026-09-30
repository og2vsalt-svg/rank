import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

async function digest(file: File) {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function NavePage() {
  const [a, setA] = useState<{ name: string; hash: string; size: number } | null>(null);
  const [b, setB] = useState<{ name: string; hash: string; size: number } | null>(null);
  const [busy, setBusy] = useState(false);

  async function take(which: 'a' | 'b', file?: File) {
    if (!file) return;
    setBusy(true);
    const hash = await digest(file);
    const rec = { name: file.name, hash, size: file.size };
    if (which === 'a') setA(rec); else setB(rec);
    setBusy(false);
  }

  const match = a && b ? a.hash === b.hash : null;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">nave</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">two files, one aisle</h1>
          <p className="text-neutral-400 text-sm mb-6">compare sha-256 of two locals. nothing leaves the tab. large files only warn that hashing may pause.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {(['a', 'b'] as const).map((side) => (
              <label key={side} className="cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-6 text-center">
                <input type="file" className="hidden" onChange={(e) => take(side, e.target.files?.[0])} />
                <p className="text-sm font-medium">file {side}</p>
                <p className="text-xs text-neutral-500 mt-2 truncate">{(side === 'a' ? a : b)?.name || 'choose'}</p>
              </label>
            ))}
          </div>
          {busy && <p className="text-xs text-neutral-500 mt-4">hashing… the tab may feel sleepy on large locals.</p>}
          {a && <p className="text-[11px] text-neutral-500 mt-4 break-all">a · {a.hash}</p>}
          {b && <p className="text-[11px] text-neutral-500 mt-1 break-all">b · {b.hash}</p>}
          {match === true && <p className="text-sm text-emerald-300 mt-4">same bytes.</p>}
          {match === false && <p className="text-sm text-amber-300 mt-4">different bytes.</p>}
        </motion.div>
      </div>
    </div>
  );
}
