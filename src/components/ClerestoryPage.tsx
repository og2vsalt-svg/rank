import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

async function digest(file: File) {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

export default function ClerestoryPage() {
  const [a, setA] = useState<{ name: string; size: number; hash: string } | null>(null);
  const [b, setB] = useState<{ name: string; size: number; hash: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');

  const load = async (which: 'a' | 'b', list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    setWarn(f.size > 40 * 1024 * 1024 ? 'large file. hashing may feel slow. no cap.' : '');
    setBusy(true);
    try {
      const hash = await digest(f);
      const row = { name: f.name, size: f.size, hash };
      if (which === 'a') setA(row);
      else setB(row);
    } finally {
      setBusy(false);
    }
  };

  const same = a && b && a.hash === b.hash;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">clerestory</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">hold two locals up to the light.</h1>
          <p className="text-neutral-400 text-sm mb-6">sha-256 in the tab. nothing uploads. if the hashes match, they are the same bytes.</p>
          <div className="grid sm:grid-cols-2 gap-3 mb-5">
            {(['a', 'b'] as const).map((side) => (
              <label key={side} className="block cursor-pointer rounded-2xl border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-6 text-center">
                <input type="file" className="hidden" onChange={(e) => load(side, e.target.files)} />
                <p className="text-sm text-white">file {side}</p>
                <p className="text-xs text-neutral-500 mt-1">{busy ? 'hashing\u2026' : 'drop here'}</p>
              </label>
            ))}
          </div>
          {warn && <p className="text-xs text-amber-300/80 mb-4">{warn}</p>}
          {a && <p className="text-xs text-neutral-500 break-all mb-2">{a.name} \u00b7 {pretty(a.size)} \u00b7 {a.hash}</p>}
          {b && <p className="text-xs text-neutral-500 break-all mb-4">{b.name} \u00b7 {pretty(b.size)} \u00b7 {b.hash}</p>}
          {a && b && (
            <p className={`text-sm font-medium ${same ? 'text-emerald-400' : 'text-amber-300'}`}>
              {same ? 'same light. same bytes.' : 'different panes.'}
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
