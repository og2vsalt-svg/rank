import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function rgbToHex(r: number, g: number, b: number) {
  return '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('');
}

function sample(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const w = 48;
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
      const buckets = new Map<string, number>();
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i] & 0xf0;
        const g = data[i + 1] & 0xf0;
        const b = data[i + 2] & 0xf0;
        const key = rgbToHex(r, g, b);
        buckets.set(key, (buckets.get(key) || 0) + 1);
      }
      const colors = [...buckets.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([hex]) => hex);
      URL.revokeObjectURL(url);
      resolve(colors);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('could not read still'));
    };
    img.src = url;
  });
}

export default function SolariumPage() {
  const [preview, setPreview] = useState('');
  const [colors, setColors] = useState<string[]>([]);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState('');

  const onFile = async (file?: File) => {
    if (!file) return;
    setErr('');
    setColors([]);
    if (!file.type.startsWith('image/')) {
      setErr('needs a still. video and dumps stay on the other desks.');
      return;
    }
    setPreview(URL.createObjectURL(file));
    try {
      setColors(await sample(file));
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
          <p className="text-[#0a84ff] text-sm mb-2">solarium</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">pull a palette from a still.</h1>
          <p className="text-neutral-400 text-sm mb-6">stays in the tab. nothing hits the share db unless you take it to causeway later.</p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition-all duration-300"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onFile(e.dataTransfer.files?.[0]);
            }}
          >
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0] || undefined)} />
            <p className="text-white font-medium">drop a photo</p>
          </label>
          {preview && <img src={preview} alt="" className="mt-6 w-full rounded-2xl" />}
          {colors.length > 0 && (
            <div className="mt-5 grid grid-cols-4 gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={async () => {
                    await navigator.clipboard.writeText(c);
                    setCopied(c);
                  }}
                  className="rounded-2xl overflow-hidden border border-white/10"
                >
                  <div className="h-14" style={{ background: c }} />
                  <p className="text-[11px] py-1.5 text-neutral-400">{c}</p>
                </button>
              ))}
            </div>
          )}
          {copied && <p className="text-xs text-neutral-500 mt-3">copied {copied}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
        </motion.div>
      </div>
    </div>
  );
}
