import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function HopperPage() {
  const [rows, setRows] = useState<{ file: File; name: string }[]>([]);
  const [prefix, setPrefix] = useState('');
  const [warn, setWarn] = useState('');

  const onFiles = (list: FileList | null) => {
    if (!list?.length) return;
    const arr = [...list];
    const heavy = arr.some((f) => f.size > 40 * 1024 * 1024);
    setWarn(heavy ? 'some of these are chunky. renaming is instant, exporting copies might lag.' : '');
    if (prefix) {
      setRows(arr.map((f, i) => ({ file: f, name: `${prefix}${String(i + 1).padStart(2, '0')}-${f.name}` })));
    } else {
      setRows(arr.map((f) => ({ file: f, name: f.name })));
    }
  };

  const apply = () => {
    setRows((prev) => prev.map((r, i) => ({ ...r, name: `${prefix}${String(i + 1).padStart(2, '0')}-${r.file.name}` })));
  };

  const download = (row: { file: File; name: string }) => {
    const url = URL.createObjectURL(row.file);
    const a = document.createElement('a');
    a.href = url;
    a.download = row.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">hopper</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">rename a pile, keep the bytes.</h1>
          <p className="text-neutral-400 text-sm mb-6">batch-rename local files and download copies. never hits the vault unless you drop them later.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center transition mb-5"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}>
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <span className="text-sm text-neutral-300">drop a stack or click</span>
          </label>
          <div className="flex gap-2 mb-4">
            <input value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder="prefix like dump-" className="flex-1 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
            <button onClick={apply} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">apply</button>
          </div>
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          <ul className="space-y-2">
            {rows.map((r, i) => (
              <li key={i} className="flex items-center gap-2 rounded-2xl bg-white/[0.03] border border-white/5 px-3 py-2">
                <input value={r.name} onChange={(e) => setRows((prev) => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} className="flex-1 bg-transparent text-sm outline-none" />
                <button onClick={() => download(r)} className="text-xs text-[#0a84ff]">save copy</button>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
