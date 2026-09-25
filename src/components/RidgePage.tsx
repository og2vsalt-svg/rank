import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function cleanName(name: string) {
  const parts = name.split('.');
  const ext = parts.length > 1 ? parts.pop() : '';
  const base = parts.join('.')
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()
    .slice(0, 80) || 'file';
  return ext ? `${base}.${ext.toLowerCase()}` : base;
}

export default function RidgePage() {
  const [rows, setRows] = useState<{ from: string; to: string; size: number }[]>([]);
  const [warn, setWarn] = useState('');

  const onFiles = (list: FileList | null) => {
    if (!list?.length) return;
    const next = [...list].map((f) => ({ from: f.name, to: cleanName(f.name), size: f.size }));
    setRows(next);
    const big = next.some((r) => r.size > 40 * 1024 * 1024);
    setWarn(big ? 'one of these is huge. renaming is instant, uploading later might lag.' : '');
  };

  const copy = async () => {
    const text = rows.map((r) => `${r.from} -> ${r.to}`).join('\n');
    try { await navigator.clipboard.writeText(text); } catch {}
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">ridge</p>
          <h1 className="text-3xl font-semibold mb-3">flatten messy filenames.</h1>
          <p className="text-neutral-400 text-sm mb-6">drop files locally. we only tidy the names. nothing leaves this tab.</p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">drop files to rename</p>
            <p className="text-xs text-neutral-500 mt-2">no upload. no limit. just a clean slug.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {rows.length > 0 && (
            <div className="mt-6 space-y-2">
              {rows.map((r) => (
                <div key={r.from} className="rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3">
                  <p className="text-xs text-neutral-500 truncate">{r.from}</p>
                  <p className="text-sm text-white truncate">{r.to}</p>
                </div>
              ))}
              <button onClick={copy} className="mt-3 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">copy map</button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
