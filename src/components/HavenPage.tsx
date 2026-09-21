import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function HavenPage() {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [tick, setTick] = useState(0);
  const list = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('rank_havens') || '[]') : [];

  function add() {
    if (!url.trim()) return;
    const row = { id: Date.now().toString(36), name: name || url, url, createdAt: Date.now() };
    const next = [row, ...list];
    localStorage.setItem('rank_havens', JSON.stringify(next));
    setName('');
    setUrl('');
    setTick(tick + 1);
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">haven</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">collect public links.</h1>
          <p className="text-neutral-400 text-sm mb-6">a shelf for /s/ drops and anything else. not storage — just a clean list you can paste into discord later.</p>
          <div className="flex flex-col gap-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="label" className="rounded-2xl bg-white/[0.05] border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50" />
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://… or /s/id" className="rounded-2xl bg-white/[0.05] border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50" />
            <button onClick={add} className="self-start px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">save to haven</button>
          </div>
        </motion.div>
        <div className="mt-6 space-y-3">
          {list.map((h: any) => (
            <a key={h.id} href={h.url} target="_blank" rel="noreferrer" className="block glass rounded-[24px] p-5 hover:bg-white/[0.04] transition-colors">
              <p className="text-sm text-white">{h.name}</p>
              <p className="text-xs text-neutral-500 mt-1 break-all">{h.url}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
