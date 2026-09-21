import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function StudioPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [src, setSrc] = useState('');
  const [scale, setScale] = useState(80);
  const [warn, setWarn] = useState('');
  const [out, setOut] = useState('');

  const onPick = (f?: File) => {
    if (!f) return;
    setWarn(f.size > 12 * 1024 * 1024 ? 'big still. preview still works, tab might lag.' : '');
    const r = new FileReader();
    r.onload = () => setSrc(String(r.result || ''));
    r.readAsDataURL(f);
  };

  const bake = () => {
    if (!src) return;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      const w = Math.max(1, Math.round((img.width * scale) / 100));
      const h = Math.max(1, Math.round((img.height * scale) / 100));
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, w, h);
      setOut(c.toDataURL('image/png'));
    };
    img.src = src;
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[28px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">studio</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">resize a still on this device</h1>
          <p className="text-sm text-neutral-500 mb-6">not a vault. local preview, download a smaller png. no upload unless you take it to harbor.</p>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPick(e.target.files?.[0])} />
          <button onClick={() => inputRef.current?.click()} className="w-full rounded-2xl border border-dashed border-white/15 px-6 py-10 text-sm text-neutral-400">
            pick an image
          </button>
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {src && <img src={src} alt="" className="mt-4 max-h-56 rounded-2xl object-contain w-full" />}
          <label className="block mt-4 text-xs text-neutral-500">scale {scale}%</label>
          <input type="range" min={10} max={100} value={scale} onChange={(e) => setScale(Number(e.target.value))} className="w-full" />
          <button onClick={bake} disabled={!src} className="mt-4 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">bake png</button>
          {out && (
            <a href={out} download="studio.png" className="ml-2 inline-flex px-5 py-2.5 rounded-full glass text-sm">download</a>
          )}
        </motion.div>
      </div>
    </div>
  );
}
