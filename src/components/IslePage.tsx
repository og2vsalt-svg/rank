import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function IslePage() {
  const [seed, setSeed] = useState('rankvault');
  const hue = useMemo(() => {
    let h = 0;
    for (const c of seed) h = (h + c.charCodeAt(0) * 17) % 360;
    return h;
  }, [seed]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8 overflow-hidden">
          <p className="text-[#0a84ff] text-sm mb-2">isle</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a color island from a word.</h1>
          <p className="text-neutral-400 text-sm mb-6">type anything. we spin a soft wash. not files. just a mood board you can screenshot.</p>
          <input value={seed} onChange={(e) => setSeed(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-full px-5 py-3 text-sm text-white outline-none focus:border-[#0a84ff]/50 transition mb-6" />
          <div className="h-40 rounded-[24px] relative overflow-hidden">
            <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 30% 30%, hsl(${hue} 80% 58%), transparent 55%), radial-gradient(circle at 70% 70%, hsl(${(hue + 40) % 360} 70% 48%), #050506)` }} />
          </div>
          <p className="text-xs text-neutral-500 mt-4">hue {hue}</p>
        </motion.div>
      </div>
    </div>
  );
}
