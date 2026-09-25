import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function MossPage() {
  const [id, setId] = useState('');
  const [title, setTitle] = useState('rankvault drop');
  const [copied, setCopied] = useState('');

  const links = useMemo(() => {
    const clean = id.trim().replace(/^#?share\?f=/, '');
    if (!clean) return null;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return {
      embed: `${origin}/s/${encodeURIComponent(clean)}`,
      page: `${origin}/p/moss`,
      app: `${origin}/#share?f=${encodeURIComponent(clean)}`,
    };
  }, [id]);

  const copy = async (v: string, label: string) => {
    try {
      await navigator.clipboard.writeText(v);
      setCopied(label);
    } catch {
      setCopied('could not copy');
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">moss</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">grow a discord card.</h1>
          <p className="text-neutral-400 text-sm mb-6">paste a share id. we give you the /s/ embed url bots actually unfurl. looks like a real drop card, not a bare hash.</p>
          <input value={id} onChange={(e) => setId(e.target.value)} placeholder="share id or #share?f=..." className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#0a84ff]/50 mb-3" />
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="card title hint" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#0a84ff]/50" />
          {links && (
            <div className="mt-6 space-y-3">
              <div className="rounded-2xl bg-black/40 border border-white/8 p-4">
                <p className="text-[11px] text-neutral-500 mb-1">preview</p>
                <p className="text-white font-medium">{title || 'rankvault drop'}</p>
                <p className="text-xs text-neutral-500 mt-1">public drop on rankvault · discord reads /s/</p>
              </div>
              <button onClick={() => copy(links.embed, 'embed')} className="w-full text-left rounded-2xl bg-white/5 px-4 py-3 text-xs text-neutral-300 break-all hover:bg-white/8">copy embed · {links.embed}</button>
              <button onClick={() => copy(links.app, 'app')} className="w-full text-left rounded-2xl bg-white/5 px-4 py-3 text-xs text-neutral-300 break-all hover:bg-white/8">copy app · {links.app}</button>
              {copied && <p className="text-xs text-[#0a84ff]">copied {copied}</p>}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
