import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Item = { id: string; text: string; at: number };

const KEY = 'rankvault-drift';

export default function DriftPage() {
  const [text, setText] = useState('');
  const [items, setItems] = useState<Item[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items.slice(0, 80)));
  }, [items]);

  function add() {
    const t = text.trim();
    if (!t) return;
    setItems((prev) => [{ id: crypto.randomUUID(), text: t, at: Date.now() }, ...prev]);
    setText('');
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5">
        <div className="max-w-xl mx-auto">
          <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-3">drift</p>
          <h1 className="text-3xl font-semibold text-white tracking-tight">quiet wall</h1>
          <p className="text-sm text-neutral-500 mt-2 mb-8">not a vault. local-only scraps that fade as you add more. no hard cap, just slowness if you dump a novel.</p>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-5 space-y-3">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="leave something"
              rows={4}
              className="w-full bg-black/30 rounded-2xl px-4 py-3 text-sm text-white outline-none border border-white/10 resize-none"
            />
            {text.length > 20000 && (
              <p className="text-xs text-amber-300">huge paste. the page may feel slow.</p>
            )}
            <motion.button whileTap={{ scale: 0.98 }} onClick={add} className="w-full rounded-full bg-white text-black text-sm font-medium py-2.5">
              pin to wall
            </motion.button>
          </motion.div>

          <ul className="mt-6 space-y-3">
            {items.map((it) => (
              <li key={it.id} className="glass rounded-2xl p-4">
                <p className="text-sm text-white whitespace-pre-wrap">{it.text}</p>
                <p className="text-[11px] text-neutral-500 mt-2">{new Date(it.at).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
