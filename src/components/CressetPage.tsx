import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function CressetPage() {
  const [note, setNote] = useState('');
  const [glow, setGlow] = useState(42);

  return (
    <div className="min-h-screen" style={{ background: `radial-gradient(ellipse at top, rgba(10,132,255,${glow / 400}), #050506)` }}>
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">cresset</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a night lamp for a pasted note.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            dim the page and read. stays on this device. not a vault and not a public drop.
          </p>
          <label className="block text-sm text-neutral-400 mb-4">
            lamp
            <input
              type="range"
              min={8}
              max={80}
              value={glow}
              onChange={(e) => setGlow(Number(e.target.value))}
              className="w-full mt-2"
            />
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="paste something you want to read slowly"
            className="w-full min-h-[280px] rounded-3xl bg-black/40 border border-white/10 p-5 text-[17px] leading-relaxed text-neutral-100 outline-none focus:border-[#0a84ff]/40"
            style={{ fontSize: 16 + glow / 20 }}
          />
        </motion.div>
      </div>
    </div>
  );
}
