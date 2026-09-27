import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function LanternPage() {
  const [id, setId] = useState('');
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const clean = id.trim().replace(/^#?share\?f=/, '').replace(/^\/?s\//, '');
  const embed = clean ? `${origin}/s/${encodeURIComponent(clean)}` : '';
  const app = clean ? `${origin}/#share?f=${encodeURIComponent(clean)}` : '';

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">lantern</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">preview a discord card</h1>
          <p className="text-neutral-400 text-sm mb-6">paste a share id. bots hitting /s/:id get the og tags. humans bounce to the vault share view.</p>
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="share id"
            className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50"
          />
          {clean && (
            <div className="mt-6 space-y-2 text-xs text-neutral-400 break-all">
              <p>embed url: {embed}</p>
              <p>app url: {app}</p>
              <div className="flex gap-2 pt-2">
                <button onClick={() => navigator.clipboard.writeText(embed).catch(() => {})} className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium">copy embed</button>
                <a href={embed} className="px-4 py-2 rounded-full bg-white/5 text-sm">open embed</a>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
