import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

export default function PebblePage() {
  const [name, setName] = useState('');
  const [size, setSize] = useState('');
  const [kind, setKind] = useState('');
  const [warn, setWarn] = useState('');

  const onFile = (f: File | undefined) => {
    if (!f) return;
    setName(f.name);
    setSize(pretty(f.size));
    setKind(f.type || 'unknown');
    setWarn(f.size > 40 * 1024 * 1024 ? 'chunky file. preview might feel slow. no cap.' : '');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">pebble</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">read a file without keeping it.</h1>
          <p className="text-neutral-400 text-sm mb-6">local inspect only. name, type, size. nothing leaves the tab.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files[0]); }}>
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <p className="text-white font-medium">drop one file</p>
            <p className="text-xs text-neutral-500 mt-2">no upload. just a card.</p>
          </label>
          {name && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-2xl bg-white/[0.04] border border-white/8 p-5">
              <p className="text-white font-medium break-all">{name}</p>
              <p className="text-sm text-neutral-400 mt-1">{kind} · {size}</p>
            </motion.div>
          )}
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
        </motion.div>
      </div>
    </div>
  );
}
