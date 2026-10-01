import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function count(text: string) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  const lines = text.split('\n').length;
  const sentences = text.trim() ? text.split(/[.!?]+/).filter((s) => s.trim()).length : 0;
  return { words, chars, lines, sentences };
}

export default function LintolPage() {
  const [text, setText] = useState('');
  const stats = useMemo(() => count(text), [text]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm font-medium mb-2 tracking-wide">lintol</p>
          <h1 className="text-3xl font-semibold text-white tracking-tight mb-2">weigh a draft in the tab</h1>
          <p className="text-neutral-400 text-sm mb-6">counts stay on this device. nothing uploads. not a file cabinet.</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={12}
            placeholder="pour words under the lintol"
            className="w-full mb-5 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm outline-none focus:border-[#0a84ff]/50 resize-y"
          />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {([
              ['words', stats.words],
              ['chars', stats.chars],
              ['lines', stats.lines],
              ['sentences', stats.sentences],
            ] as const).map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3">
                <p className="text-neutral-500 text-xs uppercase tracking-wide">{k}</p>
                <p className="text-white text-xl font-medium tabular-nums">{v}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
