import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';

type Item = { id: string; name: string; size: number; type: string };

export default function TrovePage() {
  const [items, setItems] = useState<Item[]>([]);

  const add = (list: FileList | null) => {
    if (!list) return;
    const next: Item[] = [];
    for (let i = 0; i < list.length; i++) {
      const f = list[i];
      next.push({ id: Date.now().toString(36) + i, name: f.name, size: f.size, type: f.type || 'file' });
    }
    setItems((prev) => [...prev, ...next]);
  };

  const total = items.reduce((a, b) => a + b.size, 0);
  const warn = total > 40 * 1024 * 1024;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">trove</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">local share queue.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            stack files you plan to drop. nothing leaves the browser. no cap, just a slowness note if the pile is huge.
          </p>
          <label className="block rounded-3xl border border-dashed border-white/15 bg-black/20 px-6 py-8 text-center cursor-pointer hover:border-[#0a84ff]/40 transition-colors mb-5">
            <input type="file" multiple className="hidden" onChange={(e) => add(e.target.files)} />
            <p className="text-sm text-neutral-300">add files to the pile</p>
          </label>
          <p className="text-xs text-neutral-500 mb-3">{items.length} files · {(total / 1024 / 1024).toFixed(2)} mb</p>
          {warn && <p className="text-amber-300/90 text-xs mb-4">big pile. some previews may feel slow.</p>}
          <div className="space-y-2">
            <AnimatePresence>
              {items.map((it) => (
                <motion.div
                  key={it.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-black/25 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{it.name}</p>
                    <p className="text-xs text-neutral-500">{it.type}</p>
                  </div>
                  <button onClick={() => setItems((p) => p.filter((x) => x.id !== it.id))} className="text-xs text-neutral-400 hover:text-white">
                    drop
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          {items.length > 0 && (
            <button onClick={() => setItems([])} className="mt-5 px-4 py-2 rounded-full bg-white/10 text-sm">
              clear pile
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
