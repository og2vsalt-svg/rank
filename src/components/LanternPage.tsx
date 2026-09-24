import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function LanternPage() {
  const [id, setId] = useState('');
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const embed = useMemo(() => {
    const clean = id.trim().replace(/^#share\?f=/, '').replace(/^\/s\//, '');
    if (!clean) return '';
    if (clean.startsWith('http')) return clean;
    return `${origin}/s/${clean}`;
  }, [id, origin]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">lantern</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">preview the discord card.</h1>
          <p className="text-neutral-400 text-sm mb-6">paste a share id or /s/ link. this is not the vault — it just shows how the unfurl should look before you drop it in chat.</p>
          <input value={id} onChange={(e) => setId(e.target.value)} placeholder="share id or /s/abc123" className="w-full rounded-2xl bg-white/[0.05] border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50" />
          {embed && (
            <div className="mt-6 rounded-2xl overflow-hidden border border-white/10 bg-[#2b2d31]">
              <div className="flex">
                <div className="w-1 bg-[#0a84ff]" />
                <div className="p-4 flex-1">
                  <p className="text-[#00a8fc] text-[12px] mb-1">rankvault</p>
                  <p className="text-white text-[15px] font-semibold">file drop</p>
                  <p className="text-[#dbdee1] text-[13px] mt-1 break-all">{embed}</p>
                  <div className="mt-3 h-28 rounded-lg bg-gradient-to-br from-[#0a84ff]/40 to-[#af52de]/20" />
                </div>
              </div>
            </div>
          )}
          <p className="text-[11px] text-neutral-500 mt-4">every page also has /e/pagename so discord can unfurl tools, not just files.</p>
        </motion.div>
      </div>
    </div>
  );
}
