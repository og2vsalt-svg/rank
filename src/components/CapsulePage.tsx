import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function CapsulePage() {
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [when, setWhen] = useState('');
  const [saved, setSaved] = useState<string | null>(null);

  function lock() {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    const row = { id, name: name || 'untitled capsule', note, opensAt: when, createdAt: Date.now() };
    const list = JSON.parse(localStorage.getItem('rank_capsules') || '[]');
    list.unshift(row);
    localStorage.setItem('rank_capsules', JSON.stringify(list));
    setSaved(id);
    setName('');
    setNote('');
  }

  const list = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('rank_capsules') || '[]') : [];
  const now = Date.now();

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">capsule</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">time lock a note.</h1>
          <p className="text-neutral-400 text-sm mb-6">not the vault. this is a sealed note that stays quiet until the date you pick. huge attachments just warn you they might feel slow.</p>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="capsule name" className="w-full rounded-2xl bg-white/[0.05] border border-white/10 px-4 py-3 text-sm outline-none mb-3 focus:border-[#0a84ff]/50" />
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="what should open later" className="w-full min-h-[120px] rounded-2xl bg-white/[0.05] border border-white/10 px-4 py-3 text-sm outline-none mb-3 focus:border-[#0a84ff]/50" />
          <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="w-full rounded-2xl bg-white/[0.05] border border-white/10 px-4 py-3 text-sm outline-none mb-4 focus:border-[#0a84ff]/50" />
          <button onClick={lock} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">seal capsule</button>
          {saved && <p className="text-xs text-neutral-500 mt-3">sealed {saved}</p>}
        </motion.div>
        <div className="mt-6 space-y-3">
          {list.map((c: any) => {
            const open = !c.opensAt || new Date(c.opensAt).getTime() <= now;
            return (
              <div key={c.id} className="glass rounded-[24px] p-5">
                <p className="text-sm text-white">{c.name}</p>
                <p className="text-xs text-neutral-500 mt-1">{open ? 'unlocked' : 'locked until ' + c.opensAt}</p>
                {open && <p className="text-sm text-neutral-300 mt-3 whitespace-pre-wrap">{c.note}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
