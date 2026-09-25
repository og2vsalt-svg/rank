import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { shareUrls } from '../lib/cloudShare';

export default function HorizonPage() {
  const [id, setId] = useState('');
  const urls = id.trim() ? shareUrls(id.trim()) : null;
  const [copied, setCopied] = useState('');

  const copy = async (v: string) => {
    try {
      await navigator.clipboard.writeText(v);
      setCopied(v);
    } catch {}
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">horizon</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">make the discord card look expensive.</h1>
          <p className="text-neutral-400 text-sm mb-6">paste a share id. we hand you the /s/ embed path bots actually unfurl. humans still land on the pretty share page.</p>
          <input value={id} onChange={(e) => setId(e.target.value)} placeholder="share id" className="w-full px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
          {urls && (
            <div className="mt-6 space-y-3">
              <button onClick={() => copy(urls.embed)} className="w-full text-left px-4 py-3 rounded-2xl bg-white/5 text-sm break-all">{urls.embed}</button>
              <button onClick={() => copy(urls.app)} className="w-full text-left px-4 py-3 rounded-2xl bg-white/5 text-sm break-all">{urls.app}</button>
              {copied && <p className="text-xs text-neutral-500">copied</p>}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
