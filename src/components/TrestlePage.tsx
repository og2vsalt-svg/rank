import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Meta = { name: string; type: string; size: number; last: string };

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

function readMeta(file?: File): Meta | null {
  if (!file) return null;
  return { name: file.name, type: file.type || 'unknown', size: file.size, last: file.lastModified ? new Date(file.lastModified).toLocaleString() : '—' };
}

export default function TrestlePage() {
  const [a, setA] = useState<Meta | null>(null);
  const [b, setB] = useState<Meta | null>(null);
  const [warn, setWarn] = useState('');

  const grab = (side: 'a' | 'b', file?: File) => {
    if (!file) return;
    if (file.size > 80 * 1024 * 1024) setWarn('huge file. we only read metadata so it should still be fine.');
    else setWarn('');
    const m = readMeta(file);
    if (side === 'a') setA(m);
    else setB(m);
  };

  const row = (label: string, left?: string, right?: string) => (
    <div className="grid grid-cols-3 gap-3 py-3 border-b border-white/5 text-sm">
      <p className="text-neutral-500">{label}</p>
      <p className="truncate text-neutral-200">{left || '—'}</p>
      <p className="truncate text-neutral-200">{right || '—'}</p>
    </div>
  );

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm mb-2">trestle</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">compare two local files. no upload.</h1>
          <p className="text-neutral-400 text-sm mb-6">names, types, sizes, dates. nothing leaves the tab.</p>
          <div className="grid sm:grid-cols-2 gap-3 mb-6">
            {(['a', 'b'] as const).map((side) => (
              <label key={side} className="cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-6 text-center transition">
                <input type="file" className="hidden" onChange={(e) => grab(side, e.target.files?.[0])} />
                <p className="text-sm text-neutral-300">file {side}</p>
              </label>
            ))}
          </div>
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          <div className="glass rounded-[28px] p-5">
            {row('name', a?.name, b?.name)}
            {row('type', a?.type, b?.type)}
            {row('size', a ? pretty(a.size) : undefined, b ? pretty(b.size) : undefined)}
            {row('modified', a?.last, b?.last)}
            {a && b && (
              <p className="text-xs text-neutral-500 mt-4">
                {a.size === b.size && a.name === b.name ? 'same name and size' : `size delta ${pretty(Math.abs(a.size - b.size))}`}
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
