import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Note = { id: string; text: string; at: number };
const KEY = 'rank-heath-notes';

export default function HeathPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState('');
  const [mins, setMins] = useState(10);

  useEffect(() => {
    try { setNotes(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch {}
  }, []);

  const persist = (next: Note[]) => {
    setNotes(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const add = () => {
    if (!text.trim()) return;
    persist([{ id: Date.now().toString(36), text: text.trim(), at: Date.now() + mins * 60_000 }, ...notes].slice(0, 40));
    setText('');
  };

  const now = Date.now();

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">heath</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">leave a timed note.</h1>
          <p className="text-neutral-400 text-sm mb-6">local reminders only. not files, not the vault.</p>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none mb-3" placeholder="what should this tab remember" />
          <div className="flex items-center gap-3 mb-6">
            <input type="number" min={1} value={mins} onChange={(e) => setMins(Number(e.target.value) || 1)} className="w-20 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm" />
            <span className="text-xs text-neutral-500">minutes</span>
            <button onClick={add} className="ml-auto px-4 py-2 rounded-full bg-[#0a84ff] text-white text-sm">park it</button>
          </div>
          <ul className="space-y-2">
            {notes.map((n) => (
              <li key={n.id} className="rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3 flex justify-between gap-3">
                <p className="text-sm">{n.text}</p>
                <p className="text-[11px] text-neutral-500 shrink-0">{n.at <= now ? 'due' : Math.ceil((n.at - now) / 60000) + 'm'}</p>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
