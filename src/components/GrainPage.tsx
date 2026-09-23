import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function GrainPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [w, setW] = useState(640);
  const [h, setH] = useState(360);

  const paint = () => {
    const c = canvasRef.current;
    if (!c) return;
    c.width = Math.max(32, Math.min(2048, w));
    c.height = Math.max(32, Math.min(2048, h));
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const img = ctx.createImageData(c.width, c.height);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.floor(Math.random() * 255);
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  };

  const save = () => {
    const c = canvasRef.current;
    if (!c) return;
    c.toBlob((b) => {
      if (!b) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = 'grain.png';
      a.click();
    });
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
          <p className="text-[#0a84ff] text-sm mb-2">grain</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">make film grain in the tab.</h1>
          <p className="text-neutral-400 text-sm mb-6">zero hosting. just noise you can drop into another editor.</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <label className="text-xs text-neutral-500">
              width
              <input type="number" value={w} onChange={(e) => setW(Number(e.target.value))} className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-[#0a84ff]/50" />
            </label>
            <label className="text-xs text-neutral-500">
              height
              <input type="number" value={h} onChange={(e) => setH(Number(e.target.value))} className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-[#0a84ff]/50" />
            </label>
          </div>
          <div className="flex gap-2 mb-4">
            <button onClick={paint} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">roll grain</button>
            <button onClick={save} className="px-5 py-2.5 rounded-full bg-white/10 text-white text-sm">download</button>
          </div>
          <canvas ref={canvasRef} className="w-full rounded-2xl bg-black/40" />
        </motion.div>
      </div>
    </div>
  );
}
