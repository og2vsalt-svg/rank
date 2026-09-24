import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function hex(n: number) {
  return n.toString(16).padStart(2, '0');
}

export default function OpalPage() {
  const [swatches, setSwatches] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [warn, setWarn] = useState('');
  const [preview, setPreview] = useState('');

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setWarn(file.size > 25 * 1024 * 1024 ? 'chunky image. sampling can feel sleepy.' : '');
    setName(file.name);
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
        const r = data[i] >> 4 << 4;
        const g = data[i + 1] >> 4 << 4;
        const b = data[i + 2] >> 4 << 4;
        const key = `#${hex(r)}${hex(g)}${hex(b)}`;
        buckets.set(key, (buckets.get(key) || 0) + 1);
      }
      const ranked = [...buckets.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([c]) => c);
      setSwatches(ranked);
    };
    img.src = url;
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">opal</p>
          <h1 className="text-3xl font-semibold mb-3">pull colors off a local still.</h1>
          <p className="text-neutral-400 text-sm mb-6">does not upload. just samples pixels so you can copy a palette.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <p className="text-white font-medium">drop an image</p>
            <p className="text-xs text-neutral-500 mt-2">stays on this machine</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {preview && <img src={preview} alt="" className="mt-6 w-full max-h-64 object-contain rounded-2xl" />}
          {name && <p className="text-xs text-neutral-500 mt-3">{name}</p>}
          <div className="mt-6 grid grid-cols-4 gap-2">
            {swatches.map((c) => (
              <button key={c} onClick={() => navigator.clipboard.writeText(c).catch(() => {})} className="rounded-2xl overflow-hidden text-left">
                <span className="block h-14" style={{ background: c }} />
                <span className="block text-[11px] text-neutral-400 px-1 py-1.5">{c}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
