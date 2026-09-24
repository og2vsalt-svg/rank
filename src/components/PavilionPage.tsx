import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function pad(n: number) {
  return String(Math.max(0, n)).padStart(2, '0');
}

export default function PavilionPage() {
  const [title, setTitle] = useState('quiet gathering');
  const [when, setWhen] = useState('');
  const [note, setNote] = useState('');

  const remain = useMemo(() => {
    if (!when) return null;
    const t = +new Date(when) - Date.now();
    if (Number.isNaN(t)) return null;
    const s = Math.floor(t / 1000);
    const sign = s < 0 ? -1 : 1;
    const abs = Math.abs(s);
    return {
      past: sign < 0,
      d: Math.floor(abs / 86400),
      h: Math.floor((abs % 86400) / 3600),
      m: Math.floor((abs % 3600) / 60),
      s: abs % 60,
    };
  }, [when, title, note]);

  const copy = async () => {
    const lines = [title, when && new Date(when).toLocaleString(), note].filter(Boolean).join('\n');
    try {
      await navigator.clipboard.writeText(lines);
    } catch {}
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm mb-2">pavilion</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a countdown card, not a vault.</h1>
          <p className="text-neutral-400 text-sm mb-7">set a moment. the card lives on this device. copy the invite text if you want to send it.</p>
          <div className="glass rounded-[32px] p-7 space-y-4">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none" placeholder="title" />
            <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none" />
            <textarea value={note} onChange={(e) => setNote(e.target.value)} className="w-full h-28 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none resize-none" placeholder="where / who / vibe" />
            <div className="rounded-[24px] bg-white/[0.04] border border-white/8 p-6 text-center">
              <p className="text-xs text-neutral-500 mb-2">{remain?.past ? 'already passed' : 'time left'}</p>
              {remain ? (
                <p className="text-3xl font-semibold tracking-tight tabular-nums">
                  {remain.d}d {pad(remain.h)}:{pad(remain.m)}:{pad(remain.s)}
                </p>
              ) : (
                <p className="text-neutral-500 text-sm">pick a time</p>
              )}
            </div>
            <button onClick={copy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">copy invite</button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
