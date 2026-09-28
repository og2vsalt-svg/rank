import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

export default function GaugePage() {
  const [info, setInfo] = useState<{ name: string; size: number; type: string; lastModified: number } | null>(null);
  const [warn, setWarn] = useState('');

  const read = (file?: File) => {
    if (!file) return;
    setInfo({
      name: file.name,
      size: file.size,
      type: file.type || 'unknown',
      lastModified: file.lastModified,
    });
    setWarn(file.size > 40 * 1024 * 1024 ? 'no cap, but this size can make encode / preview feel sleepy.' : '');
  };

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
          <p className="text-[#0a84ff] text-sm mb-2">gauge</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">read a local file without shipping it.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not a vault. just a quiet meter for name, type, and size before you decide to share.
          </p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); read(e.dataTransfer.files?.[0]); }}
          >
            <input type="file" className="hidden" onChange={(e) => read(e.target.files?.[0])} />
            <p className="text-white font-medium">drop one file</p>
            <p className="text-xs text-neutral-500 mt-2">stays on this device.</p>
          </label>
          {info && (
            <div className="mt-6 grid gap-2 text-sm text-neutral-300">
              <p>{info.name}</p>
              <p className="text-neutral-500">{pretty(info.size)} · {info.type}</p>
              <p className="text-neutral-500">touched {new Date(info.lastModified).toLocaleString()}</p>
            </div>
          )}
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
        </motion.div>
      </div>
    </div>
  );
}
