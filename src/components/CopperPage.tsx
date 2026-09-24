import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

async function digest(file: File) {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function CopperPage() {
  const [left, setLeft] = useState<{ name: string; size: number; hash: string } | null>(null);
  const [right, setRight] = useState<{ name: string; size: number; hash: string } | null>(null);
  const [warn, setWarn] = useState('');
  const [busy, setBusy] = useState(false);

  const read = async (file: File | undefined, side: 'l' | 'r') => {
    if (!file) return;
    if (file.size > 40 * 1024 * 1024) setWarn('big file. hashing may stall the tab for a bit. no hard limit.');
    else setWarn('');
    setBusy(true);
    try {
      const hash = await digest(file);
      const row = { name: file.name, size: file.size, hash };
      if (side === 'l') setLeft(row);
      else setRight(row);
    } finally {
      setBusy(false);
    }
  };

  const match = left && right && left.hash === right.hash;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm mb-2">copper</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">hash two local files against each other.</h1>
          <p className="text-neutral-400 text-sm mb-8">sha-256 in the tab. nothing leaves the machine. handy when a download looks sketchy.</p>
          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            <label className="glass rounded-3xl p-6 text-center cursor-pointer">
              <input type="file" className="hidden" onChange={(e) => read(e.target.files?.[0], 'l')} />
              <p className="text-xs text-neutral-500 mb-2">file a</p>
              <p className="text-sm text-white break-all">{left ? left.name : 'choose'}</p>
            </label>
            <label className="glass rounded-3xl p-6 text-center cursor-pointer">
              <input type="file" className="hidden" onChange={(e) => read(e.target.files?.[0], 'r')} />
              <p className="text-xs text-neutral-500 mb-2">file b</p>
              <p className="text-sm text-white break-all">{right ? right.name : 'choose'}</p>
            </label>
          </div>
          {busy && <p className="text-xs text-neutral-500 mb-3">hashing…</p>}
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {left && (
            <p className="text-[11px] font-mono text-neutral-500 break-all mb-2">a {left.hash}</p>
          )}
          {right && (
            <p className="text-[11px] font-mono text-neutral-500 break-all mb-4">b {right.hash}</p>
          )}
          {left && right && (
            <div className={`rounded-2xl px-4 py-3 text-sm ${match ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-200'}`}>
              {match ? 'same bytes.' : 'these are not the same file.'}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
