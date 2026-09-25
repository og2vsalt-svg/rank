import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function VarnishPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mark, setMark] = useState('rankvault');
  const [warn, setWarn] = useState('');

  const paint = (file: File) => {
    if (file.size > 40 * 1024 * 1024) setWarn('big photo. canvas draw might stall a second.');
    else setWarn('');
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const c = canvasRef.current;
      if (!c) return;
      const max = 1600;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      c.width = Math.max(1, Math.round(img.width * scale));
      c.height = Math.max(1, Math.round(img.height * scale));
      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, c.width, c.height);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = `${Math.max(16, Math.round(c.width / 18))}px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'right';
      ctx.fillText(mark || 'rankvault', c.width - 24, c.height - 28);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const save = () => {
    const c = canvasRef.current;
    if (!c) return;
    c.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'varnish.png';
      a.click();
    }, 'image/png');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">varnish</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">stamp a photo, stay local.</h1>
          <p className="text-neutral-400 text-sm mb-6">draw a light watermark on a picture. nothing leaves this tab.</p>
          <input value={mark} onChange={(e) => setMark(e.target.value)} className="w-full mb-4 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center transition mb-5">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && paint(e.target.files[0])} />
            <span className="text-sm text-neutral-300">drop a photo</span>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          <canvas ref={canvasRef} className="w-full rounded-2xl mb-4 bg-black/30" />
          <button onClick={save} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">download png</button>
        </motion.div>
      </div>
    </div>
  );
}
