import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Ember = { id: string; note: string; seen: boolean };

export default function EmberPage() {
  const [note, setNote] = useState('');
  const [embers, setEmbers] = useState<Ember[]>(() => {
    try {
      return JSON.parse(sessionStorage.getItem('rankvault-ember') || '[]');
    } catch {
      return [];
    }
  });

  function persist(next: Ember[]) {
    setEmbers(next);
    sessionStorage.setItem('rankvault-ember', JSON.stringify(next));
  }

  function add() {
    if (!note.trim()) return;
    persist([{ id: crypto.randomUUID(), note: note.trim(), seen: false }, ...embers]);
    setNote('');
  }

  function burn(id: string) {
    persist(embers.filter((e) => e.id !== id));
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5">
        <div className="max-w-xl mx-auto">
          <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-3">ember</p>
          <h1 className="text-3xl font-semibold text-white tracking-tight">burn after glance</h1>
          <p className="text-sm text-neutral-500 mt-2 mb-8">session-only notes. close the tab and they fade. not a vault, just a spark.</p>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-3xl p-5 space-y-3">
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} placeholder="something you only need for a minute" className="w-full bg-black/30 rounded-2xl px-4 py-3 text-sm text-white outline-none border border-white/10 resize-none" />
            <motion.button whileTap={{ scale: 0.98 }} onClick={add} className="w-full rounded-full bg-white text-black text-sm font-medium py-2.5">light ember</motion.button>
          </motion.div>
          <ul className="mt-6 space-y-2">
            {embers.map((e) => (
              <li key={e.id} className="glass rounded-2xl px-4 py-3 flex items-start justify-between gap-3">
                <p className="text-sm text-neutral-200 whitespace-pre-wrap">{e.note}</p>
                <button onClick={() => burn(e.id)} className="text-xs text-neutral-500 shrink-0">burn</button>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
