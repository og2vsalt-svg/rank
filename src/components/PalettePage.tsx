import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function sample(data: ImageData) {
  const map = new Map<string, number>();
  const step = 16;
  for (let i = 0; i < data.data.length; i += 4 * step) {
    const r = data.data[i];
    const g = data.data[i + 1];
    const b = data.data[i + 2];
    const a = data.data[i + 3];
    if (a < 80) continue;
    const key = `${Math.round(r / 16) * 16},${Math.round(g / 16) * 16},${Math.round(b / 16) * 16}`;
    map.set(key, (map.get(key) || 0) + 1);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([k]) => `rgb(${k})`);
}

export default function PalettePage() {
  const [colors, setColors] = useState<string[]>([]);
  const [warn, setWarn] = useState('');

  const onFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setWarn('needs an image file. other types stay in the vault.');
      return;
    }
    if (file.size > 40 * 1024 * 1024) setWarn('huge image. decode might feel slow. no hard cap.');
    else setWarn('');
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      const w = Math.min(160, img.width);
      const h = Math.max(1, Math.round((img.height / img.width) * w));
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, w, h);
      setColors(sample(ctx.getImageData(0, 0, w, h)));
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">palette</p>
          <h1 className="text-3xl font-semibold mb-3">pull colors from a local file</h1>
          <p className="text-neutral-400 text-sm mb-6">stays on this device. handy before you theme a public drop.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 p-10 text-center">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <span className="text-sm">drop an image</span>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          <div className="flex gap-2 mt-6 flex-wrap">
            {colors.map((c) => (
              <button key={c} onClick={() => navigator.clipboard.writeText(c)} className="w-14 h-14 rounded-2xl border border-white/10" style={{ background: c }} title={c} />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
