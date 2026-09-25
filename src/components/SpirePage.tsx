import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Item = { name: string; size: number; type: string };

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

export default function SpirePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [warn, setWarn] = useState('');

  const onFiles = (list: FileList | null) => {
    if (!list?.length) return;
    const next = [...list].map((f) => ({ name: f.name, size: f.size, type: f.type || 'file' }));
    const total = next.reduce((s, i) => s + i.size, 0) + items.reduce((s, i) => s + i.size, 0);
    setWarn(total > 40 * 1024 * 1024 ? 'tall stack. publishing later may feel slow. still no cap.' : '');
    setItems((prev) => [...prev, ...next]);
  };

  const total = items.reduce((s, i) => s + i.size, 0);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">spire</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">stack files into a list.</h1>
          <p className="text-neutral-400 text-sm mb-6">not a vault. just a local packing list so you can see the pile before you share.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}>
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">add to the stack</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {items.length > 0 && (
            <div className="mt-6 space-y-2">
              <p className="text-xs text-neutral-500">{items.length} files · {pretty(total)}</p>
              {items.map((it, i) => (
                <div key={i} className="rounded-2xl bg-black/30 px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{it.name}</p>
                    <p className="text-[11px] text-neutral-500">{pretty(it.size)} · {it.type}</p>
                  </div>
                  <button onClick={() => setItems((p) => p.filter((_, j) => j !== i))} className="text-[12px] text-neutral-500 hover:text-white">remove</button>
                </div>
              ))}
              <button onClick={() => setItems([])} className="mt-2 text-[13px] text-neutral-400 hover:text-white">clear stack</button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
