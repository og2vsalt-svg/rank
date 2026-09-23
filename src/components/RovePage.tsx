import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function RovePage() {
  const [raw, setRaw] = useState('vault\ndrop\nnotes\npaste\nshare');
  const [pick, setPick] = useState('');

  const lines = useMemo(
    () => raw.split('\n').map((s) => s.trim()).filter(Boolean),
    [raw]
  );

  const spin = () => {
    if (!lines.length) return;
    setPick(lines[Math.floor(Math.random() * lines.length)]);
  };

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
          <p className="text-[#0a84ff] text-sm mb-2">rove</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">shuffle a list.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            dump file names, drop ids, or desk names. tap spin when you cannot decide what to open next.
          </p>
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={8}
            className="w-full mb-4 rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50 resize-y"
          />
          <button onClick={spin} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">
            spin
          </button>
          {pick && (
            <motion.p
              key={pick}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 text-2xl font-semibold tracking-tight"
            >
              {pick}
            </motion.p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
