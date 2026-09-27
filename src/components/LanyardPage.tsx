import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function origin() {
  return window.location.origin.replace(/\/$/, '');
}

export default function LanyardPage() {
  const [id, setId] = useState('');
  const [copied, setCopied] = useState('');
  const clean = id.trim().replace(/^[#/]+/, '');
  const card = clean ? `${origin()}/s/${encodeURIComponent(clean)}` : '';
  const app = clean ? `${origin()}/#share?f=${encodeURIComponent(clean)}` : '';

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
    } catch {
      setCopied('could not copy');
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">lanyard</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">discord card, no extra chrome.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            paste a live share id. you get the /s embed path discord actually unfurls, plus the in-app hash.
            this is not another vault grid.
          </p>
          <input
            value={id}
            onChange={(e) => { setId(e.target.value); setCopied(''); }}
            placeholder="share id"
            className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50"
          />
          {card && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 space-y-3"
            >
              <div className="rounded-2xl bg-black/30 border border-white/8 p-4">
                <p className="text-[11px] uppercase tracking-wide text-neutral-500 mb-1">discord embed</p>
                <p className="text-sm break-all text-neutral-200">{card}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => copy(card, 'embed copied')} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">copy /s card</button>
                <button onClick={() => copy(app, 'app link copied')} className="px-5 py-2.5 rounded-full bg-white/5 text-sm">copy app link</button>
              </div>
              {copied && <p className="text-xs text-[#0a84ff]">{copied}</p>}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
