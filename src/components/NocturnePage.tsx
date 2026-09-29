import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

const KEY = 'rankvault-nocturne';

export default function NocturnePage() {
  const [text, setText] = useState('');
  const [dim, setDim] = useState(0.55);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (typeof p.text === 'string') setText(p.text);
        if (typeof p.dim === 'number') setDim(p.dim);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ text, dim }));
    } catch {}
  }, [text, dim]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
          style={{ opacity: 0.45 + dim * 0.55 }}
        >
          <p className="text-[#0a84ff] text-sm mb-2">nocturne</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">write after the lights go down.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            stays on this device. dim the page if the room is already dark. not a file locker.
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="a line for later…"
            className="w-full min-h-[220px] rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-white outline-none resize-y mb-5"
          />
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>{text.length} letters</span>
            <label className="flex items-center gap-3">
              glow
              <input
                type="range"
                min={0.15}
                max={1}
                step={0.01}
                value={dim}
                onChange={(e) => setDim(Number(e.target.value))}
                className="accent-[#0a84ff]"
              />
            </label>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
