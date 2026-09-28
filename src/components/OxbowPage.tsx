import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Bend = { id: string; name: string; when: number; note: string };

const KEY = 'rankvault-oxbow';

export default function OxbowPage() {
  const [name, setName] = useState('');
  const [hours, setHours] = useState('6');
  const [note, setNote] = useState('');
  const [bends, setBends] = useState<Bend[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setBends(JSON.parse(raw));
    } catch {}
  }, []);

  const save = (next: Bend[]) => {
    setBends(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  };

  const add = () => {
    const h = Math.max(0.25, Number(hours) || 6);
    const bend: Bend = {
      id: Date.now().toString(36),
      name: name.trim() || 'unnamed drop',
      when: Date.now() + h * 3600 * 1000,
      note: note.trim(),
    };
    save([bend, ...bends].slice(0, 40));
    setName('');
    setNote('');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">oxbow</p>
          <h1 className="text-3xl font-semibold mb-3">bend a reminder back toward a drop.</h1>
          <p className="text-neutral-400 text-sm mb-6">nothing uploads. this desk only keeps a quiet local loop so you remember to share later.</p>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="file or drop name" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-[#0a84ff]/50 mb-3" />
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="why you should come back" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-[#0a84ff]/50 mb-3" />
          <div className="flex gap-3 items-center mb-5">
            <input value={hours} onChange={(e) => setHours(e.target.value)} className="w-24 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none" />
            <span className="text-sm text-neutral-500">hours from now</span>
          </div>
          <button onClick={add} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">set bend</button>
          <ul className="mt-8 space-y-2">
            {bends.map((b) => {
              const due = b.when <= Date.now();
              return (
                <li key={b.id} className="rounded-2xl bg-white/[0.04] px-4 py-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-white">{b.name}</p>
                    <p className="text-xs text-neutral-500">{due ? 'due now' : new Date(b.when).toLocaleString()}{b.note ? ' · ' + b.note : ''}</p>
                  </div>
                  <button onClick={() => save(bends.filter((x) => x.id !== b.id))} className="text-[12px] text-neutral-400">clear</button>
                </li>
              );
            })}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
