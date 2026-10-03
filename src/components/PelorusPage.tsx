import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import Navbar from './Navbar';

const ease = [0.22, 1, 0.36, 1] as const;

function origin() {
  return window.location.origin;
}

export default function PelorusPage() {
  const [raw, setRaw] = useState('');
  const [copied, setCopied] = useState('');

  const parsed = useMemo(() => {
    const text = raw.trim();
    if (!text) return null;
    const id = text.split('/').filter(Boolean).pop()?.split('?')[0]?.replace(/^f=/, '') || text;
    const clean = id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
    if (!clean) return null;
    const base = origin();
    return {
      id: clean,
      card: `${base}/s/${clean}`,
      open: `${base}/#share?f=${clean}`,
    };
  }, [raw]);

  async function copy(label: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(''), 1400);
  }

  return (
    <div className="mesh min-h-screen text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-20">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[#0a84ff] text-sm font-medium tracking-wide">bearing, not a drawer</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }} className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight">pelorus</motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }} className="mt-4 text-neutral-400 text-lg leading-relaxed max-w-xl">
          paste a share id or a rankvault link. pelorus hands you the Discord card path. it does not store the file again.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.45, ease }} className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
          <label className="text-xs uppercase tracking-[0.14em] text-neutral-500">share id or link</label>
          <input value={raw} onChange={(e) => setRaw(e.target.value)} placeholder="mq1… or https://…/s/mq1" className="mt-2 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-[15px] outline-none focus:border-[#0a84ff]/60" />
          {parsed && (
            <div className="mt-5 space-y-3">
              <div className="rounded-2xl bg-black/30 border border-white/10 p-4">
                <p className="text-xs text-neutral-500">paste this in Discord</p>
                <p className="mt-1 font-medium break-all">{parsed.card}</p>
                <button onClick={() => copy('card', parsed.card)} className="mt-3 text-sm px-3.5 py-1.5 rounded-full bg-white text-black">{copied === 'card' ? 'copied' : 'copy card link'}</button>
              </div>
              <button onClick={() => copy('open', parsed.open)} className="text-sm text-neutral-300 hover:text-white">{copied === 'open' ? 'copied the open link' : 'copy the in-app open link'}</button>
            </div>
          )}
        </motion.div>
        <p className="mt-6 text-sm text-neutral-500">/pelorus unfurls as its own card. file links still unfurl on /s.</p>
      </main>
    </div>
  );
}
