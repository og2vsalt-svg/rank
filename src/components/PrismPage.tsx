import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function rgbHex(r: number, g: number, b: number) {
  return '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('');
}

export default function PrismPage() {
  const [colors, setColors] = useState<string[]>([]);
  const [preview, setPreview] = useState('');
  const [warn, setWarn] = useState('');

  const onFile = (file?: File) => {
    if (!file) return;
    setWarn(file.size > 20 * 1024 * 1024 ? 'huge still. sampling might hitch for a sec. no cap.' : '');
    const url = URL.createObjectURL(file);
    setPreview(url);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const w = 48;
      const h = Math.max(1, Math.round((img.height / img.width) * w));
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;
      const buckets = new Map<string, number>();
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i] & 0xf0;
        const g = data[i + 1] & 0xf0;
        const b = data[i + 2] & 0xf0;
        const key = rgbHex(r, g, b);
        buckets.set(key, (buckets.get(key) || 0) + 1);
      }
      const ranked = [...buckets.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([hex]) => hex);
      setColors(ranked);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">prism</p>
          <h1 className="text-3xl font-semibold mb-3">pull a palette off a still.</h1>
          <p className="text-neutral-400 text-sm mb-6">stays on this device. not a vault. just colors you can copy.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center transition mb-6">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <p className="text-white font-medium">drop an image</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mb-4">{warn}</p>}
          {preview && <img src={preview} alt="" className="w-full h-40 object-cover rounded-2xl mb-6 opacity-90" />}
          <div className="grid grid-cols-4 gap-2">
            {colors.map((c) => (
              <button key={c} onClick={() => navigator.clipboard.writeText(c).catch(() => {})} className="rounded-2xl overflow-hidden border border-white/10 text-left">
                <div className="h-14" style={{ background: c }} />
                <p className="px-2 py-1.5 text-[11px] text-neutral-400 font-mono">{c}</p>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
