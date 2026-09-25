import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function HaloPage() {
  const [src, setSrc] = useState('');
  const [out, setOut] = useState('');
  const [warn, setWarn] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const load = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 40 * 1024 * 1024) setWarn('chunky image. encode might feel sleepy. no cap.');
    else setWarn('');
    const url = URL.createObjectURL(file);
    setSrc(url);
    setOut('');
    const img = new Image();
    img.onload = () => {
      const c = canvasRef.current;
      if (!c) return;
      const size = 720;
      c.width = size;
      c.height = size;
      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, size, size);
      ctx.save();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 8, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      const s = Math.min(img.width, img.height);
      const sx = (img.width - s) / 2;
      const sy = (img.height - s) / 2;
      ctx.drawImage(img, sx, sy, s, s, 0, 0, size, size);
      ctx.restore();
      ctx.strokeStyle = 'rgba(10,132,255,0.7)';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 6, 0, Math.PI * 2);
      ctx.stroke();
      setOut(c.toDataURL('image/png'));
    };
    img.src = url;
  };

  const download = () => {
    if (!out) return;
    const a = document.createElement('a');
    a.href = out;
    a.download = 'halo.png';
    a.click();
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">halo</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">circle crop on device.</h1>
          <p className="text-neutral-400 text-sm mb-6">not a vault. pick a local still, get a round png. stays in this tab unless you save it.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/40 p-8 text-center transition-colors">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => load(e.target.files?.[0])} />
            <p className="text-white font-medium">drop a photo</p>
            <p className="text-xs text-neutral-500 mt-2">no hard limit. just a slowness note if it is huge.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          <canvas ref={canvasRef} className="hidden" />
          {out && (
            <div className="mt-8 flex flex-col items-center gap-5">
              <img src={out} alt="halo" className="w-56 h-56 rounded-full shadow-[0_20px_60px_rgba(10,132,255,0.18)]" />
              <button onClick={download} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">save png</button>
            </div>
          )}
          {src && !out && <p className="text-xs text-neutral-500 mt-4">drawing…</p>}
        </motion.div>
      </div>
    </div>
  );
}
