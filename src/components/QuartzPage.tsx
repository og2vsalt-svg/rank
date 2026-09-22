import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Meta = { name: string; type: string; size: number; lastModified: number; warn?: string };

export default function QuartzPage() {
  const [rows, setRows] = useState<Meta[]>([]);

  const onFiles = (list: FileList | null) => {
    if (!list) return;
    const next: Meta[] = Array.from(list).map((f) => ({
      name: f.name,
      type: f.type || 'unknown',
      size: f.size,
      lastModified: f.lastModified,
      warn: f.size > 80 * 1024 * 1024 ? 'huge file. listing is fine, previews may hitch.' : undefined,
    }));
    setRows(next);
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
          <p className="text-[#0a84ff] text-sm mb-2">quartz</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">read the grain of a file.</h1>
          <p className="text-neutral-400 text-sm mb-6">name, type, size, modified. no upload. no cap. just a slowness note if it is massive.</p>
          <label className="block mb-6">
            <span className="sr-only">choose files</span>
            <input type="file" multiple onChange={(e) => onFiles(e.target.files)} className="block w-full text-sm text-neutral-400 file:mr-3 file:rounded-full file:border-0 file:bg-white file:text-black file:px-4 file:py-2" />
          </label>
          <ul className="space-y-2">
            {rows.map((r, i) => (
              <li key={i} className="rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3 text-sm">
                <p className="text-white truncate">{r.name}</p>
                <p className="text-neutral-500">{r.type} · {(r.size / 1024).toFixed(1)} kb · {new Date(r.lastModified).toLocaleString()}</p>
                {r.warn && <p className="text-xs text-amber-400/80 mt-1">{r.warn}</p>}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
