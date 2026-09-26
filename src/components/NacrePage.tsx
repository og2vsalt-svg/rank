import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function hex(r: number, g: number, b: number) {
  return '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('');
}

export default function NacrePage() {
  const [palette, setPalette] = useState<string[]>([]);
  const [preview, setPreview] = useState('');
  const [warn, setWarn] = useState('');

  const onFile = (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    setWarn(f.size > 12 * 1024 * 1024 ? 'big picture. no cap, just might feel slow while we sample it.' : '');
    const url = URL.createObjectURL(f);
    setPreview(url);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      const w = (c.width = 48);
      const h = (c.height = 48);
      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;
      const buckets = new Map<string, number>();
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i] & 0xf0;
        const g = data[i + 1] & 0xf0;
        const b = data[i + 2] & 0xf0;
        const k = hex(r, g, b);
        buckets.set(k, (buckets.get(k) || 0) + 1);
      }
      const top = [...buckets.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k]) => k);
      setPalette(top);
    };
    img.src = url;
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
          <p className="text-[#0a84ff] text-sm mb-2">nacre</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">pull a palette off a picture.</h1>
          <p className="text-neutral-400 text-sm mb-6">stays on this device. hosting is still the center — this is just a side desk.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center transition mb-5">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files)} />
            <p className="text-white font-medium">drop an image</p>
            <p className="text-xs text-neutral-500 mt-2">no file limit. just a slowness ping if it is huge.</p>
          </label>
          {preview && <img src={preview} alt="" className="w-full max-h-64 object-contain rounded-2xl mb-5" />}
          <div className="flex gap-2 flex-wrap">
            {palette.map((c) => (
              <button
                key={c}
                onClick={async () => { try { await navigator.clipboard.writeText(c); } catch {} }}
                className="h-16 w-16 rounded-2xl border border-white/10"
                style={{ background: c }}
                title={c}
              />
            ))}
          </div>
          {palette.length > 0 && <p className="text-xs text-neutral-500 mt-3">{palette.join('  ')} · tap to copy</p>}
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
        </motion.div>
      </div>
    </div>
  );
}
