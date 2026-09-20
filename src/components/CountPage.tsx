import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function CountPage() {
  const [text, setText] = useState('');
  const stats = useMemo(() => {
    const chars = text.length;
    const noSpace = text.replace(/\s/g, '').length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lines = text ? text.split('\n').length : 0;
    const bytes = new TextEncoder().encode(text).length;
    return { chars, noSpace, words, lines, bytes };
  }, [text]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">count</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">weigh a block of text.</h1>
          <p className="text-neutral-400 text-sm mb-6">words, lines, bytes. stays on this machine.</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none mb-5"
            placeholder="paste anything"
          />
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              ['words', stats.words],
              ['chars', stats.chars],
              ['no space', stats.noSpace],
              ['lines', stats.lines],
              ['bytes', stats.bytes],
            ].map(([k, v]) => (
              <div key={String(k)} className="rounded-2xl bg-white/5 px-3 py-3">
                <p className="text-[11px] text-neutral-500">{k}</p>
                <p className="text-lg font-semibold">{v}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
