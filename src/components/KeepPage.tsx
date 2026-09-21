import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Pin = { id: string; title: string; url: string };
const KEY = 'rankvault-keep';

export default function KeepPage() {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [pins, setPins] = useState<Pin[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(pins));
  }, [pins]);

  function add() {
    const u = url.trim();
    if (!u) return;
    setPins((p) => [{ id: crypto.randomUUID(), title: title.trim() || u, url: u }, ...p]);
    setTitle('');
    setUrl('');
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5">
        <div className="max-w-xl mx-auto">
          <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-3">keep</p>
          <h1 className="text-3xl font-semibold text-white tracking-tight">soft pins</h1>
          <p className="text-sm text-neutral-500 mt-2 mb-8">save links you drop in discord. stays on this device.</p>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-5 space-y-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="label" className="w-full bg-black/30 rounded-2xl px-4 py-3 text-sm text-white outline-none border border-white/10" />
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" className="w-full bg-black/30 rounded-2xl px-4 py-3 text-sm text-white outline-none border border-white/10" />
            <motion.button whileTap={{ scale: 0.98 }} onClick={add} className="w-full rounded-full bg-white text-black text-sm font-medium py-2.5">save pin</motion.button>
          </motion.div>
          <ul className="mt-6 space-y-2">
            {pins.map((p) => (
              <li key={p.id} className="glass rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
                <a href={p.url} target="_blank" rel="noreferrer" className="text-sm text-white truncate">{p.title}</a>
                <button onClick={() => setPins((all) => all.filter((x) => x.id !== p.id))} className="text-xs text-neutral-500">drop</button>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
