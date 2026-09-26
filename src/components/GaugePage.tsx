import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(2) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

export default function GaugePage() {
  const [files, setFiles] = useState<File[]>([]);
  const total = useMemo(() => files.reduce((a, f) => a + f.size, 0), [files]);
  const warn = total > 40 * 1024 * 1024;
  const pct = Math.min(100, (total / (80 * 1024 * 1024)) * 100);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">gauge</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">weigh a pile before you send it.</h1>
          <p className="text-neutral-400 text-sm mb-6">stays on this device. no upload, no cap. just a soft warning when the tab might lag later.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/40 p-10 text-center transition">
            <input type="file" multiple className="hidden" onChange={(e) => setFiles(e.target.files ? [...e.target.files] : [])} />
            <p className="text-white font-medium">drop files to weigh them</p>
            <p className="text-xs text-neutral-500 mt-2">nothing leaves the browser.</p>
          </label>
          <div className="mt-8">
            <div className="h-2 rounded-full bg-white/8 overflow-hidden">
              <motion.div className="h-full rounded-full bg-[#0a84ff]" initial={{ width: 0 }} animate={{ width: pct + '%' }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} />
            </div>
            <p className="text-sm text-neutral-300 mt-3">{files.length} file{files.length === 1 ? '' : 's'} · {pretty(total)}</p>
            {warn && <p className="text-xs text-amber-300/80 mt-2">chunky pile. encoding later may feel slow. still allowed.</p>}
          </div>
          {files.length > 0 && (
            <ul className="mt-6 space-y-2 max-h-64 overflow-auto">
              {files.map((f) => (
                <li key={f.name + f.size} className="flex justify-between gap-3 text-sm text-neutral-400">
                  <span className="truncate">{f.name}</span>
                  <span className="shrink-0 text-neutral-500">{pretty(f.size)}</span>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>
    </div>
  );
}
