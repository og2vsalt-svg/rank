import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

async function sha256(file: File) {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function SpandrelPage() {
  const [a, setA] = useState<{ name: string; size: number; hash: string } | null>(null);
  const [b, setB] = useState<{ name: string; size: number; hash: string } | null>(null);
  const [warn, setWarn] = useState('');

  const load = async (which: 'a' | 'b', file?: File) => {
    if (!file) return;
    if (file.size > 40 * 1024 * 1024) setWarn('large file. hash still runs, just may feel slow. no cap.');
    const hash = await sha256(file);
    const row = { name: file.name, size: file.size, hash };
    if (which === 'a') setA(row); else setB(row);
  };

  const same = a && b && a.hash === b.hash;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">local compare</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">spandrel</h1>
          <p className="text-neutral-400 text-sm mb-8">span two local files and see if their sha-256 lines up. nothing leaves the tab.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {(['a', 'b'] as const).map((side) => (
              <label key={side} className="rounded-2xl border border-dashed border-white/15 p-6 cursor-pointer hover:border-[#0a84ff]/40">
                <input type="file" className="hidden" onChange={(e) => load(side, e.target.files?.[0])} />
                <p className="text-xs text-neutral-500 mb-2">file {side}</p>
                <p className="text-sm text-white truncate">{(side === 'a' ? a : b)?.name || 'drop here'}</p>
              </label>
            ))}
          </div>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {a && b && (
            <div className="mt-6 rounded-2xl bg-white/[0.04] border border-white/8 p-5">
              <p className="text-sm text-white mb-2">{same ? 'same bytes' : 'different bytes'}</p>
              <p className="text-[11px] text-neutral-500 break-all font-mono leading-relaxed">{a.hash}<br />{b.hash}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
