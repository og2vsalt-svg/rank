import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { shareUrls } from '../lib/cloudShare';

export default function NockPage() {
  const [id, setId] = useState('');
  const [copied, setCopied] = useState('');

  const clean = id.trim().replace(/^.*[?&]f=/, '').replace(/[^a-z0-9_-]/gi, '');
  const urls = clean ? shareUrls(clean) : null;

  const copy = async (v: string, label: string) => {
    try { await navigator.clipboard.writeText(v); setCopied(label); } catch {}
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">nock</p>
          <h1 className="text-3xl font-semibold mb-3">aim a share id at every embed path.</h1>
          <p className="text-neutral-400 text-sm mb-6">paste an id or a messy link. we mint the discord-friendly /s/ card plus the rest. no file cap because nothing uploads here.</p>
          <input value={id} onChange={(e) => { setId(e.target.value); setCopied(''); }} placeholder="share id or url" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-[#0a84ff]/50 mb-5" />
          {urls && (
            <ul className="space-y-2">
              {Object.entries(urls).map(([k, v]) => (
                <li key={k} className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.04] px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-wide text-neutral-500">{k}</p>
                    <p className="text-xs text-neutral-300 truncate">{v}</p>
                  </div>
                  <button onClick={() => copy(v, k)} className="shrink-0 text-[12px] px-3 py-1.5 rounded-full bg-white text-black">{copied === k ? 'copied' : 'copy'}</button>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>
    </div>
  );
}
