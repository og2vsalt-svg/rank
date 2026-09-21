import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function RidgePage() {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [pos, setPos] = useState(50);
  const [warn, setWarn] = useState('');

  const load = (file: File | undefined, side: 'a' | 'b') => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setWarn('drop an image. other types just sit there.');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setWarn('no hard cap, but big images make the slider feel sleepy.');
    } else {
      setWarn('');
    }
    const url = URL.createObjectURL(file);
    if (side === 'a') setA(url);
    else setB(url);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">ridge</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">before / after slider.</h1>
          <p className="text-neutral-400 text-sm mb-8">compare two local images. nothing leaves the tab.</p>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <label className="rounded-2xl bg-white/[0.03] border border-white/10 px-4 py-3 text-sm text-neutral-400 cursor-pointer hover:bg-white/[0.05] transition-colors">
              left image
              <input type="file" accept="image/*" className="hidden" onChange={(e) => load(e.target.files?.[0], 'a')} />
            </label>
            <label className="rounded-2xl bg-white/[0.03] border border-white/10 px-4 py-3 text-sm text-neutral-400 cursor-pointer hover:bg-white/[0.05] transition-colors">
              right image
              <input type="file" accept="image/*" className="hidden" onChange={(e) => load(e.target.files?.[0], 'b')} />
            </label>
          </div>
          {a && b ? (
            <div className="relative overflow-hidden rounded-3xl aspect-[16/10] bg-black">
              <img src={b} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 overflow-hidden" style={{ width: pos + '%' }}>
                <img src={a} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ width: `${10000 / pos}%`, maxWidth: 'none' }} />
              </div>
              <div className="absolute inset-y-0 w-px bg-white/80" style={{ left: pos + '%' }} />
              <input
                type="range"
                min={2}
                max={98}
                value={pos}
                onChange={(e) => setPos(Number(e.target.value))}
                className="absolute inset-0 opacity-0 cursor-ew-resize"
              />
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-white/10 h-56 flex items-center justify-center text-sm text-neutral-600">
              pick two stills
            </div>
          )}
          {warn && <p className="text-xs text-neutral-500 mt-4">{warn}</p>}
        </motion.div>
      </div>
    </div>
  );
}
