import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function SpindlePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');
  const warn = files.some((f) => f.size > 40 * 1024 * 1024);

  const preview = (f: File) => {
    const i = f.name.lastIndexOf('.');
    const stem = i > 0 ? f.name.slice(0, i) : f.name;
    const ext = i > 0 ? f.name.slice(i) : '';
    return `${prefix}${stem}${suffix}${ext}`;
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
          <p className="text-[#0a84ff] text-sm mb-2">spindle</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">rename a pile without touching the vault.</h1>
          <p className="text-neutral-400 text-sm mb-6">local preview only. no hard size cap. huge piles just feel sleepy.</p>
          {warn && <p className="text-xs text-amber-300/80 mb-4">some of these are huge. the tab may hitch while listing them.</p>}
          <input
            type="file"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
            className="block w-full text-sm text-neutral-400 mb-4"
          />
          <div className="grid grid-cols-2 gap-2 mb-5">
            <input value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder="prefix" className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none" />
            <input value={suffix} onChange={(e) => setSuffix(e.target.value)} placeholder="suffix" className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none" />
          </div>
          <div className="space-y-2">
            {files.map((f) => (
              <div key={f.name + f.size} className="rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3 text-sm">
                <p className="text-neutral-500 line-through text-xs mb-0.5">{f.name}</p>
                <p className="text-white">{preview(f)}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
