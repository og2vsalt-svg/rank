import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function LarkPage() {
  const [title, setTitle] = useState('rankvault drop');
  const [desc, setDesc] = useState('a quiet file. open when you want.');
  const [id, setId] = useState('');
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const embed = useMemo(() => {
    const slug = id.trim();
    return slug ? `${origin}/s/${encodeURIComponent(slug)}` : `${origin}/e/lark`;
  }, [id, origin]);

  const copy = async () => {
    try { await navigator.clipboard.writeText(embed); } catch {}
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">lark</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">discord card desk.</h1>
          <p className="text-neutral-400 text-sm mb-6">preview how a /s link should feel when discord unfurls it. paste a share id, copy the embed url.</p>
          <label className="block text-xs text-neutral-500 mb-1">share id</label>
          <input value={id} onChange={(e) => setId(e.target.value)} placeholder="id from a public drop" className="w-full mb-4 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/50" />
          <label className="block text-xs text-neutral-500 mb-1">card title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full mb-4 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none" />
          <label className="block text-xs text-neutral-500 mb-1">card body</label>
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} className="w-full mb-6 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none resize-none" />
          <div className="rounded-3xl overflow-hidden border border-white/10 bg-[#2b2d31]">
            <div className="flex">
              <div className="w-1 bg-[#0a84ff]" />
              <div className="p-4 flex-1">
                <p className="text-[11px] text-[#00a8fc] mb-1">rankvault</p>
                <p className="text-white font-semibold text-sm">{title || 'untitled'}</p>
                <p className="text-[#dbdee1] text-sm mt-1 leading-relaxed">{desc}</p>
                <p className="text-[11px] text-[#b5bac1] mt-3 break-all">{embed}</p>
              </div>
            </div>
          </div>
          <button onClick={copy} className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">copy embed url</button>
        </motion.div>
      </div>
    </div>
  );
}
