import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Room = { code: string; note: string; updated: number };

function load(): Room[] {
  try {
    return JSON.parse(localStorage.getItem('rank-relay') || '[]');
  } catch {
    return [];
  }
}

export default function RelayPage() {
  const [rooms, setRooms] = useState<Room[]>(() => load());
  const [code, setCode] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    localStorage.setItem('rank-relay', JSON.stringify(rooms));
  }, [rooms]);

  const add = () => {
    const c = (code || Math.random().toString(36).slice(2, 7)).toLowerCase();
    setRooms((r) => [{ code: c, note, updated: Date.now() }, ...r.filter((x) => x.code !== c)].slice(0, 40));
    setNote('');
    setCode(c);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[28px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">relay</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">room codes on this device</h1>
          <p className="text-sm text-neutral-500 mb-6">leave a short note under a code so you can hand someone a phrase instead of a file. stays local. not the vault.</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="code" className="flex-1 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="what lives here" className="flex-[2] px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
            <button onClick={add} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">save</button>
          </div>
          <ul className="mt-6 space-y-2">
            {rooms.map((r) => (
              <li key={r.code} className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.03] px-4 py-3">
                <div>
                  <p className="text-sm text-white font-medium">{r.code}</p>
                  <p className="text-xs text-neutral-500">{r.note || '—'}</p>
                </div>
                <button onClick={() => setRooms((x) => x.filter((i) => i.code !== r.code))} className="text-xs text-neutral-500">forget</button>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
