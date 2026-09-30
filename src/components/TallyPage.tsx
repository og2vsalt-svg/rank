import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function TallyPage() {
  const [text, setText] = useState('');

  const stats = useMemo(() => {
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const chars = text.length;
    const lines = text ? text.split(/\n/).length : 0;
    const sentences = trimmed ? trimmed.split(/[.!?]+/).filter(Boolean).length : 0;
    return { words, chars, lines, sentences };
  }, [text]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8 sm:p-10"
        >
          <p className="text-[#0a84ff] text-sm mb-2">tally</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">count a note without sending it anywhere.</h1>
          <p className="text-neutral-400 text-sm mb-6">a quiet counter. stays in the tab. not a file tray.</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={12}
            placeholder="paste something to count…"
            className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm leading-relaxed text-neutral-200 outline-none focus:border-[#0a84ff]/50 transition"
          />
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              ['words', stats.words],
              ['chars', stats.chars],
              ['lines', stats.lines],
              ['sentences', stats.sentences],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3">
                <p className="text-[11px] text-neutral-500">{label}</p>
                <p className="text-lg text-white tabular-nums">{value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
