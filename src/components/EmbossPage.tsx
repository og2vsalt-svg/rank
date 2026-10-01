import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { shareUrls } from '../lib/cloudShare';

export default function EmbossPage() {
  const [id, setId] = useState('');
  const urls = useMemo(() => (id.trim() ? shareUrls(id.trim()) : null), [id]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">emboss</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">preview the discord stamp.</h1>
          <p className="text-neutral-400 text-sm mb-6">paste a share id. we show the public /s card url that crawlers hit. nothing uploads from this desk.</p>
          <input value={id} onChange={(e) => setId(e.target.value.trim())} placeholder="share id" className="w-full mb-5 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none" />
          {urls ? (
            <div className="rounded-3xl overflow-hidden border border-white/10 bg-[#111214]">
              <div className="h-1.5 bg-[#0A84FF]" />
              <div className="p-5">
                <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 mb-2">rankvault</p>
                <p className="text-lg font-medium tracking-tight">public drop</p>
                <p className="text-sm text-neutral-400 mt-1">open this in discord to see the finished unfurl.</p>
                <p className="text-xs text-[#0a84ff] mt-4 break-all">{urls.embed}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-neutral-500">waiting on an id.</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
