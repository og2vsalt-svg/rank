import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function UmberPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [warn, setWarn] = useState('');
  const [ready, setReady] = useState(false);

  const onFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setWarn('needs a still image');
      return;
    }
    if (file.size > 25 * 1024 * 1024) setWarn('chunky still. grade may hitch. no cap.');
    else setWarn('');
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const c = canvasRef.current;
      if (!c) return;
      const max = 1400;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      c.width = Math.max(1, Math.round(img.width * scale));
      c.height = Math.max(1, Math.round(img.height * scale));
      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, c.width, c.height);
      const data = ctx.getImageData(0, 0, c.width, c.height);
      const px = data.data;
      for (let i = 0; i < px.length; i += 4) {
        const r = px[i];
        const g = px[i + 1];
        const b = px[i + 2];
        px[i] = Math.min(255, r * 1.08 + 12);
        px[i + 1] = Math.min(255, g * 0.96 + 4);
        px[i + 2] = Math.min(255, b * 0.78);
      }
      ctx.putImageData(data, 0, 0);
      setReady(true);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const save = () => {
    const c = canvasRef.current;
    if (!c) return;
    const a = document.createElement('a');
    a.href = c.toDataURL('image/jpeg', 0.92);
    a.download = 'umber.jpg';
    a.click();
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm mb-2">umber</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">warm grade on a still. stays local.</h1>
          <p className="text-neutral-400 text-sm mb-6">not a vault slot. just a one-pass color wash you can save back to disk.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-6 text-center mb-4 transition">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <p className="text-sm text-neutral-300">drop a photo</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          <canvas ref={canvasRef} className="w-full rounded-[24px] bg-black/20" />
          {ready && (
            <button onClick={save} className="mt-4 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">save graded copy</button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
