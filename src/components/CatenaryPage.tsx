import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function pretty(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' KB';
  return (n / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function CatenaryPage() {
  const [files, setFiles] = useState<File[]>([]);

  const curve = useMemo(() => {
    if (!files.length) return '';
    const sizes = files.map((f) => Math.max(1, f.size));
    const max = Math.max(...sizes);
    const w = 560;
    const h = 160;
    const pts = sizes.map((s, i) => {
      const x = (i / Math.max(1, sizes.length - 1)) * w;
      const sag = 1 - s / max;
      const y = 24 + sag * (h - 40);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return `M ${pts.join(' L ')}`;
  }, [files]);

  const total = files.reduce((s, f) => s + f.size, 0);

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
          <p className="text-[#0a84ff] text-sm mb-2">catenary</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">hang the weight of locals on a quiet curve.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            nothing leaves the tab. this is a hanging line of sizes so you can feel a pile before you share it elsewhere.
          </p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center mb-6">
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && setFiles(Array.from(e.target.files))}
            />
            <p className="text-white font-medium">drape a handful of files</p>
          </label>
          <svg viewBox="0 0 560 160" className="w-full h-40 mb-4">
            <path d={curve || 'M 0,80 L 560,80'} fill="none" stroke="#0a84ff" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <p className="text-xs text-neutral-500">
            {files.length} hung · {pretty(total)}
            {total > 40 * 1024 * 1024 ? ' · large pile, previews may feel slow' : ''}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
