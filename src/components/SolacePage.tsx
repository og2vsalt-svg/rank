import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

const KEY = 'rankvault.solace.notes';

type Note = { id: string; title: string; body: string; updated: number };

export default function SolacePage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setNotes(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(notes));
  }, [notes]);

  const current = notes.find((n) => n.id === active);

  const add = () => {
    const n: Note = { id: Date.now().toString(36), title: 'untitled', body: '', updated: Date.now() };
    setNotes((xs) => [n, ...xs]);
    setActive(n.id);
  };

  const patch = (partial: Partial<Note>) => {
    if (!active) return;
    setNotes((xs) => xs.map((n) => (n.id === active ? { ...n, ...partial, updated: Date.now() } : n)));
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-6 sm:p-8">
          <p className="text-[#0a84ff] text-sm mb-2">solace</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a private desk that never leaves this browser.</h1>
          <p className="text-neutral-400 text-sm mb-6">not a file vault. scratch notes live in local storage only.</p>
          <div className="grid sm:grid-cols-[220px_1fr] gap-4">
            <div>
              <button onClick={add} className="w-full mb-3 rounded-2xl bg-[#0a84ff] text-white text-sm py-2.5">new note</button>
              <div className="space-y-1 max-h-80 overflow-y-auto">
                {notes.map((n) => (
                  <button key={n.id} onClick={() => setActive(n.id)} className={`w-full text-left px-3 py-2 rounded-xl text-sm ${active === n.id ? 'bg-white/10 text-white' : 'text-neutral-400 hover:bg-white/5'}`}>
                    {n.title || 'untitled'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              {current ? (
                <>
                  <input value={current.title} onChange={(e) => patch({ title: e.target.value })} className="w-full bg-transparent text-xl font-medium outline-none mb-3" />
                  <textarea value={current.body} onChange={(e) => patch({ body: e.target.value })} rows={14} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none resize-none" />
                </>
              ) : (
                <p className="text-neutral-500 text-sm">pick a note or start a quiet one.</p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
