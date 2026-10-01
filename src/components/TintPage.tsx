import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function sample(img: HTMLImageElement) {
  const c = document.createElement('canvas');
  const w = 48;
  const h = 48;
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) return [] as string[];
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;
  const buckets = new Map<string, number>();
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i] >> 4 << 4;
    const g = data[i + 1] >> 4 << 4;
    const b = data[i + 2] >> 4 << 4;
    const key = `rgb(${r}, ${g}, ${b})`;
    buckets.set(key, (buckets.get(key) || 0) + 1);
  }
  return [...buckets.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k]) => k);
}

export default function TintPage() {
  const [colors, setColors] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [note, setNote] = useState('');

  const onFile = (file: File) => {
    setName(file.name);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setColors(sample(img));
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">tint</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">a palette from a still</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">Nothing leaves the tab. Drop a photo and keep the colours for a caption or a card.</p>
        </motion.div>
        <label className="glass mt-8 block cursor-pointer rounded-3xl p-8 text-center">
          <input className="hidden" type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          <div className="text-[15px]">{name || 'choose an image'}</div>
        </label>
        {colors.length > 0 && (
          <div className="mt-6 grid grid-cols-3 gap-3">
            {colors.map((c) => (
              <button key={c} onClick={() => navigator.clipboard.writeText(c)} className="glass overflow-hidden rounded-2xl text-left">
                <div style={{ background: c }} className="h-16" />
                <div className="px-3 py-2 text-[12px] text-white/70">{c}</div>
              </button>
            ))}
          </div>
        )}
        <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="a line to keep with the palette" className="glass mt-4 min-h-24 w-full rounded-2xl px-4 py-3 text-[14px] outline-none" />
      </main>
    </div>
  );
}
