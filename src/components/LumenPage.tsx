import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { shareUrls } from '../lib/cloudShare';

export default function LumenPage() {
  const [id, setId] = useState('');
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const urls = id.trim() ? shareUrls(id.trim()) : null;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">lumen</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">discord card builder.</h1>
          <p className="text-neutral-400 text-sm mb-6">paste a share id. copy the /s/ link so discord, slack, and x unfurl a clean card.</p>
          <input value={id} onChange={(e) => setId(e.target.value)} placeholder="share id" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-[#0a84ff]/50" />
          {urls && (
            <div className="mt-6 space-y-3">
              <p className="text-xs text-neutral-500 break-all">app: {urls.app}</p>
              <p className="text-xs text-neutral-500 break-all">embed: {urls.embed}</p>
              <p className="text-xs text-neutral-500 break-all">page card: {origin}/e/drop</p>
              <button onClick={() => navigator.clipboard.writeText(urls.embed)} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">copy embed url</button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
