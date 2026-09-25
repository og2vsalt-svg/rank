import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Item = { id: string; name: string; size: number; type: string };

export default function PalletPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [warn, setWarn] = useState('');

  const onFiles = (list: FileList | null) => {
    if (!list?.length) return;
    const next = [...list].map((f) => ({ id: Math.random().toString(36).slice(2), name: f.name, size: f.size, type: f.type || 'file' }));
    const total = [...items, ...next].reduce((a, b) => a + b.size, 0);
    setWarn(total > 80 * 1024 * 1024 ? 'pallet is getting heavy. the tab may feel slow. still no hard cap.' : '');
    setItems((s) => [...next, ...s]);
  };

  const total = items.reduce((a, b) => a + b.size, 0);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">pallet</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">stage files before you publish.</h1>
          <p className="text-neutral-400 text-sm mb-6">a local tray. nothing leaves the browser until you take it to drop or vault.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center transition mb-5" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}>
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">stack onto the pallet</p>
            <p className="text-xs text-neutral-500 mt-2">{items.length} files · {(total / 1024 / 1024).toFixed(2)} mb staged</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mb-4">{warn}</p>}
          <div className="space-y-2">
            {items.map((it) => (
              <div key={it.id} className="flex items-center justify-between rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{it.name}</p>
                  <p className="text-[11px] text-neutral-500">{it.type || 'file'} · {(it.size / 1024).toFixed(1)} kb</p>
                </div>
                <button onClick={() => setItems((s) => s.filter((x) => x.id !== it.id))} className="text-xs text-neutral-500 hover:text-white">off</button>
              </div>
            ))}
          </div>
          {items.length > 0 && (
            <button onClick={() => setItems([])} className="mt-5 px-5 py-2.5 rounded-full bg-white/5 text-sm">clear pallet</button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
