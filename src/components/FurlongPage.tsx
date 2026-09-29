import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function pretty(n: number) {
  if (n < 1024) return `${n} b`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} kb`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(2)} mb`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} gb`;
}

function fmtSec(s: number) {
  if (!isFinite(s) || s <= 0) return 'already there';
  if (s < 1) return 'under a second';
  if (s < 60) return `${Math.ceil(s)} s`;
  if (s < 3600) return `${Math.floor(s / 60)} m ${Math.round(s % 60)} s`;
  return `${Math.floor(s / 3600)} h ${Math.round((s % 3600) / 60)} m`;
}

export default function FurlongPage() {
  const [size, setSize] = useState(0);
  const [name, setName] = useState('');
  const [mbps, setMbps] = useState(25);
  const [warn, setWarn] = useState('');

  const eta = useMemo(() => {
    const bits = size * 8;
    const rate = Math.max(0.1, mbps) * 1_000_000;
    return bits / rate;
  }, [size, mbps]);

  const onFile = (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    setName(f.name);
    setSize(f.size);
    setWarn(f.size > 80 * 1024 * 1024 ? 'large file. the tab may feel sleepy while it thinks. no hard cap.' : '');
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
          <p className="text-[#0a84ff] text-sm mb-2">furlong</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">how long would this drop take to travel.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            a local yardstick. pick a file, pick a line speed. nothing leaves this tab.
          </p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files)} />
            <p className="text-white font-medium">{name || 'choose a local file'}</p>
            {size > 0 && <p className="text-xs text-neutral-500 mt-2">{pretty(size)}</p>}
          </label>
          <label className="block mt-6 text-sm text-neutral-400">
            assumed megabits per second
            <input
              type="range"
              min={1}
              max={1000}
              value={mbps}
              onChange={(e) => setMbps(Number(e.target.value))}
              className="w-full mt-2"
            />
            <span className="text-white">{mbps} mbps</span>
          </label>
          {size > 0 && (
            <p className="mt-6 text-2xl font-semibold tracking-tight text-white">{fmtSec(eta)}</p>
          )}
          {warn && <p className="text-amber-300/90 text-xs mt-3">{warn}</p>}
        </motion.div>
      </div>
    </div>
  );
}
