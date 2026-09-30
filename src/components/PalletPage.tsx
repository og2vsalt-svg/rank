import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Swatch = { hex: string; count: number };

function rgbToHex(r: number, g: number, b: number) {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

function extract(file: File): Promise<Swatch[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const max = 96;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) { URL.revokeObjectURL(url); reject(new Error('no canvas')); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const buckets = new Map<string, number>();
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 40) continue;
        const r = data[i] & 0xf0;
        const g = data[i + 1] & 0xf0;
        const b = data[i + 2] & 0xf0;
        const key = rgbToHex(r, g, b);
        buckets.set(key, (buckets.get(key) || 0) + 1);
      }
      URL.revokeObjectURL(url);
      const ranked = [...buckets.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([hex, count]) => ({ hex, count }));
      resolve(ranked);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('could not read image')); };
    img.src = url;
  });
}

export default function PalletPage() {
  const [swatches, setSwatches] = useState<Swatch[]>([]);
  const [preview, setPreview] = useState('');
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState('');

  const pick = async (f: File | null) => {
    setErr('');
    setSwatches([]);
    setPreview('');
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setErr('needs a still image. nothing leaves the tab.');
      return;
    }
    setPreview(URL.createObjectURL(f));
    try {
      setSwatches(await extract(f));
    } catch (e: any) {
      setErr(e?.message || 'failed');
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[28px] p-7">
          <p className="text-[#0a84ff] text-sm mb-2">pallet</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">lift colors off a still.</h1>
          <p className="text-neutral-400 text-sm mb-6">not a vault. a local sampler. drop an image and we pull the loudest eight hexes. nothing is uploaded.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center mb-5 transition-colors duration-300">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0] || null)} />
            <span className="text-sm text-neutral-300">choose a still</span>
          </label>
          {preview && <img src={preview} alt="" className="w-full rounded-2xl mb-5 max-h-64 object-cover" />}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <div className="grid grid-cols-4 gap-2">
            {swatches.map((s) => (
              <button
                key={s.hex}
                onClick={async () => { await navigator.clipboard.writeText(s.hex); setCopied(s.hex); }}
                className="rounded-2xl overflow-hidden text-left transition-transform active:scale-95"
              >
                <div className="h-14" style={{ background: s.hex }} />
                <p className="text-[11px] text-neutral-400 px-2 py-1.5 font-mono">{s.hex}</p>
              </button>
            ))}
          </div>
          {copied && <p className="text-xs text-neutral-500 mt-4">copied {copied}</p>}
        </motion.div>
      </div>
    </div>
  );
}
