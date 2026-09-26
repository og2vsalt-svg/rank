import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { shareUrls } from '../lib/cloudShare';

export default function LanternPage() {
  const [id, setId] = useState('');
  const urls = id.trim() ? shareUrls(id.trim()) : null;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">lantern</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">preview the embed card.</h1>
          <p className="text-neutral-400 text-sm mb-6">paste a share id. this desk shows the discord / slack card url so you can unfurl it without hunting through the vault.</p>
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="share id"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-[#0a84ff]/50 transition-colors"
          />
          {urls && (
            <div className="mt-6 space-y-3 text-sm">
              <p className="text-neutral-400 break-all">app: {urls.app}</p>
              <p className="text-neutral-400 break-all">embed: {urls.embed}</p>
              <a href={urls.embed} className="inline-flex px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">open embed path</a>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
