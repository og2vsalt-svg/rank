import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function ForgePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [name, setName] = useState('');
  const [w, setW] = useState(800);
  const [h, setH] = useState(800);
  const [preview, setPreview] = useState('');
  const [warn, setWarn] = useState('');

  const onFile = (file?: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 30 * 1024 * 1024) setWarn('no limit, just a heads up — huge files resize slower.');
    else setWarn('');
    setName(file.name.replace(/\.[^.]+$/, '') + '-resized.png');
    const img = new Image();
    img.onload = () => {
      setW(img.width);
      setH(img.height);
      const c = canvasRef.current;
      if (!c) return;
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      setPreview(c.toDataURL('image/png'));
    };
    img.src = URL.createObjectURL(file);
  };

  const resize = () => {
    const c = canvasRef.current;
    if (!c || !preview) return;
    const img = new Image();
    img.onload = () => {
      c.width = Math.max(1, w);
      c.height = Math.max(1, h);
      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, c.width, c.height);
      setPreview(c.toDataURL('image/png'));
    };
    img.src = preview;
  };

  const download = () => {
    if (!preview) return;
    const a = document.createElement('a');
    a.href = preview;
    a.download = name || 'resized.png';
    a.click();
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">forge</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">resize an image here.</h1>
          <p className="text-neutral-400 text-sm mb-8">local only. no upload unless you later drop it in the vault.</p>
          <label className="block rounded-2xl bg-white/[0.03] border border-white/10 px-4 py-3 text-sm text-neutral-400 cursor-pointer hover:bg-white/[0.05] transition-colors mb-6">
            pick an image
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
          <div className="flex gap-3 mb-4">
            <input type="number" value={w} onChange={(e) => setW(Number(e.target.value) || 1)} className="flex-1 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
            <input type="number" value={h} onChange={(e) => setH(Number(e.target.value) || 1)} className="flex-1 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
            <button onClick={resize} className="px-5 py-2.5 rounded-full bg-white/10 text-sm">resize</button>
          </div>
          <canvas ref={canvasRef} className="hidden" />
          {preview && <img src={preview} alt="" className="w-full rounded-2xl mb-6" />}
          <button onClick={download} disabled={!preview} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 transition-transform active:scale-[0.98]">
            download png
          </button>
          {warn && <p className="text-xs text-neutral-500 mt-4">{warn}</p>}
        </motion.div>
      </div>
    </div>
  );
}
