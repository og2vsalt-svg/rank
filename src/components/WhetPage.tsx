import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function cleanName(name: string) {
  const parts = name.split('.');
  const ext = parts.length > 1 ? '.' + parts.pop() : '';
  const base = parts.join('.') || 'file';
  return (
    base
      .normalize('NFKD')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase()
      .slice(0, 80) + ext.toLowerCase()
  );
}

export default function WhetPage() {
  const [rows, setRows] = useState<{ from: string; to: string; size: number }[]>([]);

  const onFiles = (list: FileList | null) => {
    if (!list?.length) return;
    setRows([...list].map((f) => ({ from: f.name, to: cleanName(f.name), size: f.size })));
  };

  const warn = rows.some((r) => r.size > 40 * 1024 * 1024);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">whet</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">sharpen messy filenames.</h1>
          <p className="text-neutral-400 text-sm mb-6">stays on device. no upload. good before you publish a drop so discord cards look tidy.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">drop files to preview names</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">some of these are huge. renaming is instant, publishing later might feel slow.</p>}
          <div className="mt-6 space-y-2">
            {rows.map((r) => (
              <div key={r.from} className="rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3">
                <p className="text-xs text-neutral-500 line-through">{r.from}</p>
                <p className="text-sm text-white">{r.to}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
