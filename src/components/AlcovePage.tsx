import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Note = { id: string; title: string; body: string; at: number };

const KEY = 'rankvault.alcove.notes';

export default function AlcovePage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setNotes(JSON.parse(raw));
    } catch {}
  }, []);

  const persist = (next: Note[]) => {
    setNotes(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  };

  const add = () => {
    if (!title.trim() && !body.trim()) return;
    persist([{ id: Date.now().toString(36), title: title.trim() || 'untitled', body, at: Date.now() }, ...notes]);
    setTitle('');
    setBody('');
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
          <p className="text-[#0a84ff] text-sm mb-2">alcove</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">tiny notes that never leave this browser.</h1>
          <p className="text-neutral-400 text-sm mb-6">not a vault. just a side pocket for scraps. no upload, no cap.</p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="title"
            className="w-full mb-2 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="what you dont want in the cloud"
            rows={5}
            className="w-full mb-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none resize-none"
          />
          <button onClick={add} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">keep</button>
          <div className="mt-8 space-y-3">
            {notes.map((n) => (
              <motion.div key={n.id} whileHover={{ y: -2 }} className="rounded-2xl bg-white/[0.03] border border-white/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-white mb-1">{n.title}</p>
                    <p className="text-xs text-neutral-500 whitespace-pre-wrap">{n.body}</p>
                  </div>
                  <button onClick={() => persist(notes.filter((x) => x.id !== n.id))} className="text-xs text-neutral-500 hover:text-white">drop</button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
