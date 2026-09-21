import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Note = { id: string; body: string; burnAt: number };

const KEY = 'rankvault-veil';

function load(): Note[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export default function VeilPage() {
  const [notes, setNotes] = useState<Note[]>(() => load());
  const [body, setBody] = useState('');
  const [mins, setMins] = useState(10);
  const now = Date.now();

  useEffect(() => {
    const live = notes.filter((n) => n.burnAt > Date.now());
    if (live.length !== notes.length) setNotes(live);
    localStorage.setItem(KEY, JSON.stringify(live));
  }, [notes]);

  useEffect(() => {
    const t = setInterval(() => setNotes((n) => n.filter((x) => x.burnAt > Date.now())), 1000);
    return () => clearInterval(t);
  }, []);

  const add = () => {
    const text = body.trim();
    if (!text) return;
    const n: Note = {
      id: Date.now().toString(36),
      body: text,
      burnAt: Date.now() + Math.max(1, mins) * 60 * 1000,
    };
    setNotes([n, ...notes]);
    setBody('');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[28px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">veil</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">fade notes</h1>
          <p className="text-sm text-neutral-500 mb-6">scratch something that vanishes on a timer. stays on this device only. no cloud, no share unless you copy it yourself.</p>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder="write then let it fade" className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none resize-none mb-3" />
          <div className="flex gap-2 mb-6">
            <input type="number" min={1} value={mins} onChange={(e) => setMins(Number(e.target.value) || 1)} className="w-24 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
            <span className="self-center text-xs text-neutral-500">minutes</span>
            <button onClick={add} className="ml-auto px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">seal</button>
          </div>
          <div className="space-y-3">
            {notes.length === 0 && <p className="text-sm text-neutral-500">empty veil.</p>}
            {notes.map((n) => {
              const left = Math.max(0, n.burnAt - now);
              const m = Math.floor(left / 60000);
              const s = Math.floor((left % 60000) / 1000);
              return (
                <div key={n.id} className="rounded-2xl bg-white/[0.04] border border-white/8 p-4">
                  <p className="text-sm whitespace-pre-wrap break-words">{n.body}</p>
                  <p className="text-[11px] text-neutral-500 mt-2">fades in {m}m {s}s</p>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
