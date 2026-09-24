import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { shareUrls } from '../lib/cloudShare';

export default function AtollPage() {
  const [id, setId] = useState('');
  const urls = id.trim() ? shareUrls(id.trim()) : null;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">atoll</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">make the discord card.</h1>
          <p className="text-sm text-neutral-400 mb-6">paste a share id. you get the /s/ link discord unfurls, plus the in-app hash. not another vault.</p>
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="share id"
            className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none mb-5"
          />
          {urls && (
            <div className="space-y-3">
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-[11px] uppercase tracking-wide text-neutral-500 mb-1">discord embed</p>
                <p className="text-sm break-all text-neutral-200">{urls.embed}</p>
                <button onClick={() => navigator.clipboard.writeText(urls.embed)} className="mt-3 px-4 py-1.5 rounded-full bg-white text-black text-xs font-medium">copy</button>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-[11px] uppercase tracking-wide text-neutral-500 mb-1">app link</p>
                <p className="text-sm break-all text-neutral-200">{urls.app}</p>
              </div>
              <p className="text-xs text-neutral-500">discord crawls /s/id, reads og tags, then humans land on the share desk.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
