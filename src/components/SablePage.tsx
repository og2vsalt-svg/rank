import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function fmt(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / 1024 / 1024).toFixed(2) + ' mb';
  return (n / 1024 / 1024 / 1024).toFixed(2) + ' gb';
}

export default function SablePage() {
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [size, setSize] = useState(0);
  const [warn, setWarn] = useState('');
  const [hashHint, setHashHint] = useState('');

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setName(f.name);
    setType(f.type || 'application/octet-stream');
    setSize(f.size);
    setWarn(f.size > 40 * 1024 * 1024 ? 'large file. preview clients may feel slow. no hard cap here.' : '');
    try {
      const slice = await f.slice(0, 64).arrayBuffer();
      const bytes = new Uint8Array(slice);
      setHashHint(Array.from(bytes).slice(0, 16).map((b) => b.toString(16).padStart(2, '0')).join(' '));
    } catch {
      setHashHint('');
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">sable</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">file inspect desk.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            peek at a local file before you drop it. no upload limit. we only warn when a client might choke.
          </p>
          <label className="block rounded-3xl border border-dashed border-white/15 bg-black/20 px-6 py-10 text-center cursor-pointer hover:border-[#0a84ff]/40 transition-colors">
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <p className="text-sm text-neutral-300">drop or pick anything</p>
            <p className="text-xs text-neutral-500 mt-1">stays on this device until you share</p>
          </label>
          {name && (
            <div className="mt-6 space-y-2 text-sm">
              <p className="text-white break-all">{name}</p>
              <p className="text-neutral-400">{type}</p>
              <p className="text-neutral-400">{fmt(size)}</p>
              {hashHint && <p className="text-neutral-500 font-mono text-xs">head {hashHint}</p>}
              {warn && <p className="text-amber-300/90 text-xs">{warn}</p>}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
