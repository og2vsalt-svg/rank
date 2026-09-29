import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function pretty(n: number) {
  if (n < 1024) return `${n} b`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} kb`;
  return `${(n / (1024 * 1024)).toFixed(2)} mb`;
}

type Slot = { name: string; size: number; type: string } | null;

export default function PalisadePage() {
  const [a, setA] = useState<Slot>(null);
  const [b, setB] = useState<Slot>(null);
  const [warn, setWarn] = useState('');

  const take = (which: 'a' | 'b', list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    const slot = { name: f.name, size: f.size, type: f.type || 'unknown' };
    if (which === 'a') setA(slot);
    else setB(slot);
    setWarn(f.size > 60 * 1024 * 1024 ? 'large file. comparison is metadata only, but the picker can still feel slow.' : '');
  };

  const sameName = a && b && a.name === b.name;
  const sameSize = a && b && a.size === b.size;
  const sameType = a && b && a.type === b.type;

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
          <p className="text-[#0a84ff] text-sm mb-2">palisade</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">stand two locals next to the fence.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            name, type, and size only. bytes never leave the device.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {(['a', 'b'] as const).map((which) => {
              const slot = which === 'a' ? a : b;
              return (
                <label key={which} className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-6 transition">
                  <input type="file" className="hidden" onChange={(e) => take(which, e.target.files)} />
                  <p className="text-xs text-neutral-500 mb-1">file {which}</p>
                  <p className="text-white font-medium truncate">{slot?.name || 'choose'}</p>
                  {slot && (
                    <p className="text-xs text-neutral-500 mt-2">
                      {pretty(slot.size)} · {slot.type}
                    </p>
                  )}
                </label>
              );
            })}
          </div>
          {a && b && (
            <ul className="mt-6 space-y-2 text-sm text-neutral-300">
              <li>{sameName ? 'same name' : 'different names'}</li>
              <li>{sameType ? 'same type' : 'different types'}</li>
              <li>{sameSize ? 'same size' : `delta ${pretty(Math.abs(a.size - b.size))}`}</li>
            </ul>
          )}
          {warn && <p className="text-amber-300/90 text-xs mt-3">{warn}</p>}
        </motion.div>
      </div>
    </div>
  );
}
