import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function FilletPage() {
  const [hex, setHex] = useState('#0A84FF');
  const [name, setName] = useState('apple blue');

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8 overflow-hidden"
        >
          <p className="text-[#0a84ff] text-sm font-medium mb-2 tracking-wide">fillet</p>
          <h1 className="text-3xl font-semibold text-white tracking-tight mb-2">a thin band of colour</h1>
          <p className="text-neutral-400 text-sm mb-6">stays in the tab. name a swatch for later cards. not a vault.</p>
          <div className="h-36 rounded-3xl mb-6 transition-colors duration-500" style={{ background: hex }} />
          <div className="flex flex-wrap gap-3 items-center">
            <input type="color" value={hex} onChange={(e) => setHex(e.target.value)} className="h-10 w-14 rounded-lg bg-transparent border-0 cursor-pointer" />
            <input
              value={hex}
              onChange={(e) => setHex(e.target.value)}
              className="rounded-2xl bg-white/5 border border-white/10 px-4 py-2 text-white text-sm w-32 outline-none"
            />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 min-w-[8rem] rounded-2xl bg-white/5 border border-white/10 px-4 py-2 text-white text-sm outline-none"
            />
          </div>
          <p className="text-neutral-500 text-xs mt-4">{name} · {hex.toUpperCase()}</p>
        </motion.div>
      </div>
    </div>
  );
}
