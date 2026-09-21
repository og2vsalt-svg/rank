import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function GlidePage() {
  const [left, setLeft] = useState('');
  const [right, setRight] = useState('');
  const [pos, setPos] = useState(50);

  const read = (file: File | undefined, set: (v: string) => void) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => set(String(r.result || ''));
    r.readAsDataURL(file);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#0a84ff] mb-3">tools</p>
          <h1 className="text-4xl font-semibold tracking-tight">glide</h1>
          <p className="text-neutral-400 mt-3 text-[15px] leading-relaxed">slide two stills against each other. stays on your machine. nothing leaves the tab.</p>
          <div className="flex flex-wrap gap-3 mt-8">
            <label className="px-4 py-2 rounded-full glass text-sm cursor-pointer">
              left still
              <input type="file" accept="image/*" className="hidden" onChange={(e) => read(e.target.files?.[0], setLeft)} />
            </label>
            <label className="px-4 py-2 rounded-full glass text-sm cursor-pointer">
              right still
              <input type="file" accept="image/*" className="hidden" onChange={(e) => read(e.target.files?.[0], setRight)} />
            </label>
          </div>
          <div className="glass rounded-3xl mt-6 overflow-hidden relative aspect-[16/10] bg-black/40">
            {right && <img src={right} alt="" className="absolute inset-0 w-full h-full object-cover" />}
            {left && (
              <img src={left} alt="" className="absolute inset-0 h-full object-cover" style={{ width: '100%', clipPath: `inset(0 ${100 - pos}% 0 0)` }} />
            )}
            <div className="absolute inset-y-0" style={{ left: `${pos}%` }}>
              <div className="w-px h-full bg-white/80 shadow" />
            </div>
            {!left && !right && (
              <p className="absolute inset-0 grid place-items-center text-neutral-500 text-sm">drop two stills to compare</p>
            )}
          </div>
          <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))} className="w-full mt-4 accent-[#0a84ff]" />
        </motion.div>
      </div>
    </div>
  );
}
