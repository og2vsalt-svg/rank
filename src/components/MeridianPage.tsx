import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

type Side = { name: string; size: number; type: string };

export default function MeridianPage() {
  const [a, setA] = useState<Side | null>(null);
  const [b, setB] = useState<Side | null>(null);

  const take = (which: 'a' | 'b', file?: File) => {
    if (!file) return;
    const side = { name: file.name, size: file.size, type: file.type || 'unknown' };
    if (which === 'a') setA(side);
    else setB(side);
  };

  const delta = a && b ? a.size - b.size : null;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">meridian</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">lay two locals on a line.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            a size compass, not a vault. nothing uploads. useful before you decide which cut to share.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {(['a', 'b'] as const).map((which) => (
              <label
                key={which}
                className="cursor-pointer rounded-2xl border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-6 text-center transition"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); take(which, e.dataTransfer.files?.[0]); }}
              >
                <input type="file" className="hidden" onChange={(e) => take(which, e.target.files?.[0])} />
                <p className="text-white font-medium">file {which}</p>
                <p className="text-xs text-neutral-500 mt-2">stays on this device</p>
              </label>
            ))}
          </div>
          <div className="mt-6 space-y-2 text-sm text-neutral-300">
            {a && <p>a · {a.name} · {pretty(a.size)} · {a.type}</p>}
            {b && <p>b · {b.name} · {pretty(b.size)} · {b.type}</p>}
            {delta !== null && (
              <p className="text-neutral-400">
                {delta === 0 ? 'same weight.' : delta > 0 ? `a is heavier by ${pretty(delta)}.` : `b is heavier by ${pretty(-delta)}.`}
              </p>
            )}
            {(a?.size || 0) > 40 * 1024 * 1024 || (b?.size || 0) > 40 * 1024 * 1024 ? (
              <p className="text-xs text-amber-300/80">no cap. large files just make later encode / preview feel slow.</p>
            ) : null}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
