import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Swatch = { hex: string; n: number };

function hex(r: number, g: number, b: number) {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

function sample(file: File): Promise<Swatch[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const w = Math.min(80, img.width);
      const h = Math.max(1, Math.round((img.height / img.width) * w));
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('no canvas'));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;
      const map = new Map<string, number>();
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i] & 0xf0;
        const g = data[i + 1] & 0xf0;
        const b = data[i + 2] & 0xf0;
        const key = hex(r, g, b);
        map.set(key, (map.get(key) || 0) + 1);
      }
      URL.revokeObjectURL(url);
      resolve(
        [...map.entries()]
          .map(([h, n]) => ({ hex: h, n }))
          .sort((a, b) => b.n - a.n)
          .slice(0, 12),
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('could not read image'));
    };
    img.src = url;
  });
}

export default function LoomPage() {
  const [name, setName] = useState('');
  const [warn, setWarn] = useState('');
  const [swatches, setSwatches] = useState<Swatch[]>([]);
  const [err, setErr] = useState('');

  const onFile = async (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    setName(f.name);
    setErr('');
    setWarn(f.size > 12 * 1024 * 1024 ? 'large image. sampling still runs, the tab may hitch. no hard limit.' : '');
    try {
      setSwatches(await sample(f));
    } catch (e: any) {
      setErr(e?.message || 'could not sample');
    }
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
          <p className="text-[#0a84ff] text-sm mb-2">loom</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">pull a palette from a picture.</h1>
          <p className="text-neutral-400 text-sm mb-6">local color desk. the image never leaves this tab.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files)} />
            <p className="text-white font-medium">{name || 'drop a local image'}</p>
            <p className="text-xs text-neutral-500 mt-2">no file limit. just a slowness ping if it is huge.</p>
          </label>
          {warn && <p className="text-amber-300/90 text-xs mt-3">{warn}</p>}
          {err && <p className="text-red-400 text-xs mt-3">{err}</p>}
          {swatches.length > 0 && (
            <div className="mt-8 grid grid-cols-3 sm:grid-cols-4 gap-3">
              {swatches.map((s) => (
                <button
                  key={s.hex}
                  onClick={() => navigator.clipboard.writeText(s.hex).catch(() => {})}
                  className="rounded-2xl overflow-hidden text-left"
                >
                  <div className="h-16" style={{ background: s.hex }} />
                  <p className="text-[11px] text-neutral-400 mt-1.5 tabular-nums">{s.hex}</p>
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
