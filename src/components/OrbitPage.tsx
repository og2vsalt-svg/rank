import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';

const KEY = 'rankvault.orbit.v1';

type Item = { id: string; label: string; addedAt: number };

function load(): Item[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function OrbitPage() {
  const { navigate } = useRouter();
  const [items, setItems] = useState<Item[]>(load);
  const [id, setId] = useState('');
  const [label, setLabel] = useState('');

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  function add() {
    const clean = id.trim().replace(/^.*[?#]f=/, '').replace(/^\/s\//, '').replace(/^\/file\//, '');
    if (!clean) return;
    setItems((prev) => [{ id: clean, label: label.trim() || clean, addedAt: Date.now() }, ...prev.filter((p) => p.id !== clean)]);
    setId('');
    setLabel('');
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5">
        <div className="max-w-xl mx-auto">
          <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-3">orbit</p>
          <h1 className="text-3xl font-semibold text-white tracking-tight">link shelf</h1>
          <p className="text-sm text-neutral-500 mt-2 mb-8">park share ids on this device. not a vault. just a quiet list so you stop losing drops.</p>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6 space-y-3">
            <input
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="share id or /s/abc"
              className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50"
            />
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="optional nickname"
              className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50"
            />
            <button onClick={add} className="w-full rounded-full bg-white text-black py-2.5 text-sm font-medium">pin to orbit</button>
          </motion.div>

          <div className="mt-6 space-y-2">
            {items.length === 0 && <p className="text-sm text-neutral-600">nothing parked yet.</p>}
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="glass rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{item.label}</p>
                  <p className="text-xs text-neutral-500 truncate">{item.id}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => navigate('share', item.id)} className="text-xs px-3 py-1.5 rounded-full bg-white/10">open</button>
                  <button
                    onClick={() => navigator.clipboard.writeText(`${location.origin}/s/${item.id}`)}
                    className="text-xs px-3 py-1.5 rounded-full bg-white/10"
                  >
                    copy /s
                  </button>
                  <button onClick={() => setItems((p) => p.filter((x) => x.id !== item.id))} className="text-xs text-neutral-500">drop</button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
