import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(2) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

function feel(n: number) {
  if (n < 2 * 1024 * 1024) return 'this should feel instant in the tab.';
  if (n < 12 * 1024 * 1024) return 'fine. encoding may take a breath.';
  if (n < 40 * 1024 * 1024) return 'no cap. the tab may feel a little sleepy while it encodes.';
  return 'no hard limit. expect the tab to pause while this crosses into the share db.';
}

export default function FathomPage() {
  const [files, setFiles] = useState<File[]>([]);

  const total = files.reduce((a, f) => a + f.size, 0);

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
          <p className="text-[#0a84ff] text-sm mb-2">fathom</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">how heavy will this feel?</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not a vault. drop locals here to see size and a slowness note. nothing is uploaded.
          </p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition-all duration-300"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              setFiles(Array.from(e.dataTransfer.files || []));
            }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
            <p className="text-white font-medium">drop files to weigh them</p>
            <p className="text-xs text-neutral-500 mt-2">we never block a size. we only warn.</p>
          </label>
          {files.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-3">
              {files.map((f) => (
                <div key={f.name + f.size} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-neutral-200">{f.name}</span>
                  <span className="text-neutral-500 shrink-0">{pretty(f.size)}</span>
                </div>
              ))}
              <p className="text-xs text-amber-300/80 pt-2">{pretty(total)} together. {feel(total)}</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
