import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function pickColors(img: HTMLImageElement, n = 6) {
  const c = document.createElement('canvas');
  const w = (c.width = 48);
  const h = (c.height = 48);
  const ctx = c.getContext('2d')!;
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;
  const buckets = new Map<string, number>();
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] & 0xf0;
    const g = data[i + 1] & 0xf0;
    const b = data[i + 2] & 0xf0;
    const key = `${r},${g},${b}`;
    buckets.set(key, (buckets.get(key) || 0) + 1);
  }
  return [...buckets.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => {
      const [r, g, b] = k.split(',').map(Number);
      return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
    });
}

export default function PalettePage() {
  const [colors, setColors] = useState<string[]>([]);
  const [preview, setPreview] = useState('');

  const onFile = (file?: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setPreview(url);
      setColors(pickColors(img));
    };
    img.src = url;
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">palette desk</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">steal colors from a still.</h1>
          <p className="text-neutral-400 text-sm mb-6">separate from hosting. drop a png or jpg, grab the muted swatches.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <p className="text-white font-medium">drop an image</p>
          </label>
          {preview && <img src={preview} alt="" className="mt-6 w-full rounded-2xl" />}
          {!!colors.length && (
            <div className="mt-5 grid grid-cols-3 gap-2">
              {colors.map((c) => (
                <button key={c} onClick={() => navigator.clipboard.writeText(c)} className="rounded-2xl overflow-hidden text-left">
                  <div className="h-16" style={{ background: c }} />
                  <p className="text-xs px-2 py-2 text-neutral-400">{c}</p>
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
