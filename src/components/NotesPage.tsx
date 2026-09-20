import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Note = { id: string; title: string; body: string; updated: number };

const KEY = 'rank_notes_db';

function load(): Note[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
function save(n: Note[]) { localStorage.setItem(KEY, JSON.stringify(n)); }

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>(load);
  const [active, setActive] = useState<string | null>(notes[0]?.id ?? null);

  useEffect(() => save(notes), [notes]);

  const current = notes.find((n) => n.id === active);

  const add = () => {
    const n: Note = { id: crypto.randomUUID(), title: 'untitled', body: '', updated: Date.now() };
    setNotes((p) => [n, ...p]);
    setActive(n.id);
  };

  const update = (patch: Partial<Note>) => {
    setNotes((p) => p.map((n) => (n.id === active ? { ...n, ...patch, updated: Date.now() } : n)));
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-24 pb-16 px-5 max-w-5xl mx-auto grid md:grid-cols-[240px_1fr] gap-4">
        <motion.aside initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-4 h-fit">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium">notes</p>
            <button onClick={add} className="text-xs px-3 py-1 rounded-full bg-white text-black">new</button>
          </div>
          <div className="space-y-1">
            {notes.map((n) => (
              <button key={n.id} onClick={() => setActive(n.id)} className={`w-full text-left px-3 py-2 rounded-2xl text-sm ${n.id === active ? 'bg-white/10 text-white' : 'text-neutral-400 hover:bg-white/5'}`}>
                <span className="block truncate">{n.title || 'untitled'}</span>
                <span className="block text-[11px] text-neutral-600">{new Date(n.updated).toLocaleDateString()}</span>
              </button>
            ))}
            {!notes.length && <p className="text-xs text-neutral-600 px-2">empty desk. tap new.</p>}
          </div>
        </motion.aside>
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[28px] p-6 min-h-[420px]">
          {current ? (
            <>
              <input value={current.title} onChange={(e) => update({ title: e.target.value })} className="w-full bg-transparent text-2xl font-semibold outline-none mb-4" placeholder="title" />
              <textarea value={current.body} onChange={(e) => update({ body: e.target.value })} className="w-full min-h-[320px] bg-transparent text-sm text-neutral-300 outline-none resize-none leading-relaxed" placeholder="write something quiet..." />
              <button onClick={() => { setNotes((p) => p.filter((n) => n.id !== current.id)); setActive(notes.find((n) => n.id !== current.id)?.id ?? null); }} className="mt-4 text-xs text-neutral-500 hover:text-red-400">delete note</button>
            </>
          ) : (
            <p className="text-neutral-500 text-sm">pick a note or start a fresh one.</p>
          )}
        </motion.section>
      </div>
    </div>
  );
}
