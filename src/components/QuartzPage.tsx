import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(2) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

export default function QuartzPage() {
  const [info, setInfo] = useState<{ name: string; type: string; size: number; last: string; warn: string } | null>(null);

  const onFiles = (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    setInfo({
      name: f.name,
      type: f.type || 'unknown',
      size: f.size,
      last: f.lastModified ? new Date(f.lastModified).toLocaleString() : 'n/a',
      warn: f.size > 40 * 1024 * 1024 ? 'this one is chunky. previewing it later might lag. no cap.' : '',
    });
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">quartz</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">read a file, keep nothing.</h1>
          <p className="text-neutral-400 text-sm mb-6">local inspect only. no vault write, no cloud. just name, type, size.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center">
            <input type="file" className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">pick one file</p>
          </label>
          {info && (
            <div className="mt-6 space-y-1 text-sm text-neutral-300">
              <p className="text-white truncate">{info.name}</p>
              <p>{info.type}</p>
              <p>{pretty(info.size)}</p>
              <p className="text-neutral-500">{info.last}</p>
              {info.warn && <p className="text-amber-300/80 text-xs pt-2">{info.warn}</p>}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
