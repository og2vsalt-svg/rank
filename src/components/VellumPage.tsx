import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function VellumPage() {
  const [text, setText] = useState('');
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  const sleepy = chars > 200_000;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm mb-2">vellum</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">a sheet for words you are not ready to share.</h1>
          <p className="text-neutral-400 text-sm mb-8">local only. paste a novel if you want. we will not cap it — just a heads up when the textarea gets heavy.</p>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={16}
            placeholder="type, dump, draft…"
            className="w-full rounded-3xl bg-white/[0.04] border border-white/10 px-4 py-4 text-sm leading-relaxed outline-none focus:border-[#0a84ff]/50 transition-colors resize-y min-h-[280px]"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs text-neutral-500">{words} words · {chars} chars</p>
            <button onClick={copy} className="px-4 py-2 rounded-full bg-white text-black text-sm hover:bg-neutral-200 transition-colors">copy sheet</button>
          </div>
          {sleepy && <p className="text-xs text-amber-300/80 mt-3">this sheet is huge. typing might feel a little laggy. still yours, still here.</p>}
        </motion.div>
      </div>
    </div>
  );
}
