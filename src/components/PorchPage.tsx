import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function PorchPage() {
  const [id, setId] = useState('');
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const card = id.trim() ? `${origin}/s/${id.trim()}` : '';

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">porch</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">the card people see first</h1>
          <p className="text-neutral-400 text-sm mb-6">paste a drop id. we give you the discord-ready /s/ link plus a quiet preview of the unfurl.</p>
          <input value={id} onChange={(e) => setId(e.target.value)} placeholder="share id" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50" />
          {card && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-3xl border border-white/10 overflow-hidden">
              <div className="h-1 bg-[#0A84FF]" />
              <div className="p-5">
                <p className="text-[11px] uppercase tracking-wide text-neutral-500">rankvault</p>
                <p className="text-lg font-medium mt-1">public drop</p>
                <p className="text-sm text-neutral-400 mt-1 break-all">{card}</p>
                <a href={card} className="inline-block mt-4 text-sm text-[#0a84ff]">open unfurl</a>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
