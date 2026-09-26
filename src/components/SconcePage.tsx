import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Wick = { id: string; text: string; at: number };
const KEY = 'rankvault-sconce';

export default function SconcePage() {
  const [text, setText] = useState('');
  const [mins, setMins] = useState(15);
  const [items, setItems] = useState<Wick[]>([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch {}
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const save = (next: Wick[]) => {
    setItems(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const add = () => {
    if (!text.trim()) return;
    save([{ id: Date.now().toString(36), text: text.trim(), at: Date.now() + mins * 60_000 }, ...items]);
    setText('');
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
          <p className="text-[#0a84ff] text-sm mb-2">sconce</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">wall lights for tiny reminders.</h1>
          <p className="text-neutral-400 text-sm mb-6">not a file vault. just a lamp while a drop uploads.</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#0a84ff]/50 mb-3 min-h-24"
            placeholder="what should glow later"
          />
          <div className="flex items-center gap-3 mb-6">
            <input type="number" min={1} value={mins} onChange={(e) => setMins(Number(e.target.value) || 1)} className="w-24 rounded-2xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none" />
            <span className="text-xs text-neutral-500">minutes</span>
            <button onClick={add} className="ml-auto px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">light it</button>
          </div>
          <div className="space-y-2">
            {items.map((w) => {
              const left = Math.max(0, w.at - now);
              return (
                <div key={w.id} className="rounded-2xl bg-white/5 px-4 py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-white">{w.text}</p>
                    <p className="text-xs text-neutral-500">{left === 0 ? 'dimmed' : Math.ceil(left / 1000) + 's left'}</p>
                  </div>
                  <button onClick={() => save(items.filter((x) => x.id !== w.id))} className="text-xs text-neutral-500">snuff</button>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
