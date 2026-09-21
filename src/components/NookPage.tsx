import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Clip = { id: string; title: string; body: string; saved: number };
const KEY = 'rankvault-nook';

export default function NookPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [clips, setClips] = useState<Clip[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(clips));
  }, [clips]);

  function add() {
    if (!body.trim()) return;
    setClips((c) => [{ id: crypto.randomUUID(), title: title.trim() || 'untitled clip', body: body.trim(), saved: Date.now() }, ...c]);
    setTitle('');
    setBody('');
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5">
        <div className="max-w-xl mx-auto">
          <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-3">nook</p>
          <h1 className="text-3xl font-semibold text-white tracking-tight">reading nook</h1>
          <p className="text-sm text-neutral-500 mt-2 mb-8">stash excerpts you want to reread. stays on this device, not the vault.</p>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-3xl p-5 space-y-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="title" className="w-full bg-black/30 rounded-2xl px-4 py-3 text-sm text-white outline-none border border-white/10" />
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder="paste a paragraph" className="w-full bg-black/30 rounded-2xl px-4 py-3 text-sm text-white outline-none border border-white/10 resize-none" />
            <motion.button whileTap={{ scale: 0.98 }} onClick={add} className="w-full rounded-full bg-white text-black text-sm font-medium py-2.5">keep in nook</motion.button>
          </motion.div>
          <ul className="mt-6 space-y-3">
            {clips.map((c) => (
              <li key={c.id} className="glass rounded-3xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-sm font-medium text-white">{c.title}</h2>
                  <button onClick={() => setClips((all) => all.filter((x) => x.id !== c.id))} className="text-xs text-neutral-500">toss</button>
                </div>
                <p className="text-sm text-neutral-400 mt-2 whitespace-pre-wrap">{c.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
