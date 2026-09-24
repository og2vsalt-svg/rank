import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';

type Note = { id: string; body: string; at: number };
const KEY = 'rankvault-ledge-v1';

export default function LedgePage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setNotes(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(notes));
  }, [notes]);

  const push = () => {
    if (!draft.trim()) return;
    setNotes((p) => [{ id: Date.now().toString(36), body: draft.trim(), at: Date.now() }, ...p]);
    setDraft('');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">ledge</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">a shelf for scraps.</h1>
          <p className="text-sm text-neutral-500 mb-6">not files. just little notes that stick to this browser.</p>
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={4} placeholder="drop a thought" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none mb-3" />
          <button onClick={push} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium mb-8">pin it</button>
          <div className="space-y-3">
            <AnimatePresence>
              {notes.map((n) => (
                <motion.div key={n.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="rounded-2xl bg-white/[0.04] border border-white/8 p-4">
                  <p className="text-sm text-neutral-200 whitespace-pre-wrap">{n.body}</p>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-[11px] text-neutral-500">{new Date(n.at).toLocaleString()}</p>
                    <button onClick={() => setNotes((p) => p.filter((x) => x.id !== n.id))} className="text-[11px] text-neutral-500 hover:text-white">toss</button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
