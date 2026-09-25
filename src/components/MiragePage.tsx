import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function MiragePage() {
  const [title, setTitle] = useState('rankvault drop');
  const [desc, setDesc] = useState('a quiet file. open when you want.');
  const [copied, setCopied] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const preview = `${origin}/p/mirage`;

  const copy = async () => {
    await navigator.clipboard.writeText(preview);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">mirage</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">preview a discord card.</h1>
          <p className="text-neutral-400 text-sm mb-6">sketch how a link unfurls. real drops use /s/id so discord gets og title, image, and theme color.</p>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full mb-2 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none" />
          <input value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full mb-5 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none" />
          <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#2b2d31]">
            <div className="flex">
              <div className="w-1 bg-[#0a84ff]" />
              <div className="p-3 flex-1">
                <p className="text-[11px] text-[#00a8fc] mb-1">rankvault</p>
                <p className="text-sm text-white font-semibold leading-tight">{title || 'untitled'}</p>
                <p className="text-xs text-[#dbdee1] mt-1">{desc}</p>
                <div className="mt-3 h-28 rounded-md bg-gradient-to-br from-[#0a84ff]/40 to-[#af52de]/30" />
              </div>
            </div>
          </div>
          <button onClick={copy} className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">{copied ? 'copied' : 'copy page embed url'}</button>
        </motion.div>
      </div>
    </div>
  );
}
