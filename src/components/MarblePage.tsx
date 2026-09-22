import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';

export default function MarblePage() {
  const { files, renameFile } = useVault() as any;
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');
  const [find, setFind] = useState('');
  const [repl, setRepl] = useState('');
  const [warn, setWarn] = useState('');

  const preview = useMemo(() => {
    return (files || []).slice(0, 40).map((f: any) => {
      let name = f.name as string;
      if (find) name = name.split(find).join(repl);
      const dot = name.lastIndexOf('.');
      const stem = dot > 0 ? name.slice(0, dot) : name;
      const ext = dot > 0 ? name.slice(dot) : '';
      return { id: f.id, from: f.name, to: `${prefix}${stem}${suffix}${ext}` };
    });
  }, [files, prefix, suffix, find, repl]);

  const apply = () => {
    if (!renameFile) {
      setWarn('rename helper missing on this vault build. names stay local preview only.');
      return;
    }
    preview.forEach((row) => {
      if (row.from !== row.to) renameFile(row.id, row.to);
    });
    setWarn('renames applied on this device. no file limit, just a slowness ping if the list is huge.');
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
          <p className="text-[#0a84ff] text-sm mb-2">marble</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">batch rename, quietly.</h1>
          <p className="text-neutral-400 text-sm mb-6">polish vault names without touching the bytes. stays on this device.</p>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <input value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder="prefix" className="px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
            <input value={suffix} onChange={(e) => setSuffix(e.target.value)} placeholder="suffix" className="px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
            <input value={find} onChange={(e) => setFind(e.target.value)} placeholder="find" className="px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
            <input value={repl} onChange={(e) => setRepl(e.target.value)} placeholder="replace" className="px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
          </div>
          <button onClick={apply} className="mb-5 px-4 py-2 rounded-full bg-white text-black text-sm font-medium">apply names</button>
          {warn && <p className="text-xs text-neutral-500 mb-4">{warn}</p>}
          <ul className="space-y-2">
            {preview.length === 0 && <li className="text-sm text-neutral-500">vault empty. drop files first.</li>}
            {preview.map((r) => (
              <li key={r.id} className="text-sm rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3">
                <p className="text-neutral-500 truncate">{r.from}</p>
                <p className="text-white truncate">{r.to}</p>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
