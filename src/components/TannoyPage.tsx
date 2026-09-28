import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { shareUrls } from '../lib/cloudShare';

export default function TannoyPage() {
  const [id, setId] = useState('');
  const [title, setTitle] = useState('rankvault drop');
  const [desc, setDesc] = useState('quiet file hosting. share only if you want.');
  const clean = id.trim().replace(/^.*[?&]f=/, '').replace(/[^a-z0-9_-]/gi, '');
  const card = clean ? shareUrls(clean).card : '';

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">tannoy</p>
          <h1 className="text-3xl font-semibold mb-3">preview the discord card before you shout.</h1>
          <p className="text-neutral-400 text-sm mb-6">live embeds read title and size from the db. this desk just shows how the card should feel so you can paste /s/ with confidence.</p>
          <input value={id} onChange={(e) => setId(e.target.value)} placeholder="share id" className="w-full mb-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-[#0a84ff]/50" />
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full mb-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-[#0a84ff]/50" />
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} className="w-full mb-5 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-[#0a84ff]/50" />
          <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#111214]">
            <div className="flex">
              <div className="w-1 bg-[#0A84FF]" />
              <div className="p-4 flex-1">
                <p className="text-[12px] text-[#00a8fc] font-medium mb-1">rankvault</p>
                <p className="text-white font-semibold leading-snug">{title || 'rankvault drop'}</p>
                <p className="text-[#dbdee1] text-sm mt-1">{desc}</p>
                <div className="mt-3 h-28 rounded-lg bg-gradient-to-br from-[#0a84ff]/30 to-white/5" />
              </div>
            </div>
          </div>
          {card && <p className="text-xs text-neutral-400 mt-4 break-all">paste this in discord: {card}</p>}
        </motion.div>
      </div>
    </div>
  );
}
