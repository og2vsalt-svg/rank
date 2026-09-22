import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Row = { name: string; size: number; ageDays: number };

export default function BarrowPage() {
  const [rows, setRows] = useState<Row[]>([]);

  const onFiles = (files: File[]) => {
    const now = Date.now();
    setRows(
      files.map((f) => ({
        name: f.name,
        size: f.size,
        ageDays: Math.max(0, Math.floor((now - f.lastModified) / 86400000)),
      })),
    );
  };

  const oldest = useMemo(() => [...rows].sort((a, b) => b.ageDays - a.ageDays), [rows]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-3xl p-8">
          <p className="text-[#0a84ff] text-sm mb-2">barrow</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">how old is this pile.</h1>
          <p className="text-neutral-400 text-sm mb-6">reads last-modified on the files you pick. nothing leaves the machine. useful before you publish a drop.</p>
          <label className="block rounded-3xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-10 text-center cursor-pointer hover:bg-white/[0.05] transition-colors">
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(Array.from(e.target.files || []))} />
            <span className="text-sm text-neutral-300">drop files here</span>
          </label>
          {oldest.length > 0 && (
            <div className="mt-6 space-y-2">
              {oldest.map((r) => (
                <div key={r.name} className="flex items-center justify-between rounded-2xl bg-black/25 px-4 py-3 gap-3">
                  <p className="text-sm text-white truncate">{r.name}</p>
                  <p className="text-xs text-neutral-500 shrink-0">{r.ageDays}d</p>
                </div>
              ))}
              {rows.some((r) => r.size > 40 * 1024 * 1024) && (
                <p className="text-amber-300/80 text-xs">large files in this pile. no hard limit, just a slowness heads up.</p>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
