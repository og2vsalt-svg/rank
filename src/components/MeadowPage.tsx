import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Note = { id: string; at: string; text: string };

export default function MeadowPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('rv_meadow');
      if (raw) setNotes(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('rv_meadow', JSON.stringify(notes.slice(0, 80)));
    } catch {}
  }, [notes]);

  const add = () => {
    const clean = text.trim();
    if (!clean) return;
    setNotes((prev) => [{ id: Date.now().toString(36), at: new Date().toISOString(), text: clean.slice(0, 280) }, ...prev]);
    setText('');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[28px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">meadow</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">a quiet board</h1>
          <p className="text-sm text-neutral-500 mb-6">tiny notes that live on this device. not a file vault, just a field you scribble in.</p>
          <div className="flex gap-2">
            <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="leave a line" className="flex-1 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
            <button onClick={add} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">pin</button>
          </div>
          <div className="mt-6 space-y-2">
            {notes.map((n) => (
              <div key={n.id} className="rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3">
                <p className="text-sm text-neutral-200">{n.text}</p>
                <p className="text-[11px] text-neutral-500 mt-1">{new Date(n.at).toLocaleString()}</p>
              </div>
            ))}
            {notes.length === 0 && <p className="text-sm text-neutral-500">empty meadow.</p>}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
