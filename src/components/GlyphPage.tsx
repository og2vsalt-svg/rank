import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { shareUrls } from '../lib/cloudShare';

export default function GlyphPage() {
  const [id, setId] = useState('');
  const [title, setTitle] = useState('rankvault drop');
  const [desc, setDesc] = useState('quiet file hosting. share only if you want.');
  const urls = useMemo(() => {
    const clean = id.trim();
    if (!clean) return { embed: `${typeof window !== 'undefined' ? window.location.origin : ''}/p/vault`, app: '' };
    return shareUrls(clean);
  }, [id]);

  const copy = async (v: string) => {
    try { await navigator.clipboard.writeText(v); } catch {}
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">glyph</p>
          <h1 className="text-3xl font-semibold mb-3">preview the discord card.</h1>
          <p className="text-neutral-400 text-sm mb-6">paste a share id. we mint the /s/ embed url bots actually scrape. humans still bounce to the app.</p>
          <input value={id} onChange={(e) => setId(e.target.value)} placeholder="share id" className="w-full mb-3 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full mb-3 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
          <input value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full mb-6 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
          <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#2b2d31] mb-6">
            <div className="flex">
              <div className="w-1 bg-[#0A84FF]" />
              <div className="p-4 flex-1">
                <p className="text-[#00a8fc] text-xs mb-1">rankvault</p>
                <p className="text-white font-semibold text-sm mb-1">{title}</p>
                <p className="text-[#dbdee1] text-sm mb-3">{desc}</p>
                <div className="h-28 rounded-xl bg-gradient-to-br from-[#0a84ff]/40 to-[#af52de]/25" />
              </div>
            </div>
          </div>
          <p className="text-[12px] text-neutral-500 break-all mb-4">{urls.embed}</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => copy(urls.embed)} className="px-5 py-2.5 rounded-full bg-[#0a84ff] text-sm">copy discord url</button>
            <button onClick={() => copy(urls.app)} disabled={!id.trim()} className="px-5 py-2.5 rounded-full bg-white/8 text-sm disabled:opacity-40">copy app hash</button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
