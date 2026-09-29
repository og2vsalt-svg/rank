import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function hexToRgb(hex: string) {
  const h = hex.replace('#', '').trim();
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full.slice(0, 6), 16);
  if (Number.isNaN(n) || full.length < 6) return { r: 10, g: 132, b: 255 };
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function luminance({ r, g, b }: { r: number; g: number; b: number }) {
  const lin = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function contrast(a: string, b: string) {
  const l1 = luminance(hexToRgb(a));
  const l2 = luminance(hexToRgb(b));
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

export default function PrismPage() {
  const [fg, setFg] = useState('#f5f5f7');
  const [bg, setBg] = useState('#050506');
  const ratio = useMemo(() => contrast(fg, bg), [fg, bg]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] overflow-hidden"
        >
          <div className="h-44 transition-colors duration-500" style={{ background: bg }}>
            <div className="h-full flex items-center justify-center px-8">
              <p className="text-3xl font-semibold tracking-tight transition-colors duration-500" style={{ color: fg }}>
                quiet type on quiet glass
              </p>
            </div>
          </div>
          <div className="p-8">
            <p className="text-[#0a84ff] text-sm mb-2">prism</p>
            <h1 className="text-3xl font-semibold tracking-tight mb-3">weigh two colours. keep the type readable.</h1>
            <p className="text-neutral-400 text-sm mb-6">a contrast desk, not a file tray. no upload, no share.</p>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <label className="text-xs text-neutral-500">
                ink
                <input value={fg} onChange={(e) => setFg(e.target.value)} className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-white outline-none" />
              </label>
              <label className="text-xs text-neutral-500">
                paper
                <input value={bg} onChange={(e) => setBg(e.target.value)} className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-white outline-none" />
              </label>
            </div>
            <p className="text-sm text-neutral-300">{ratio.toFixed(2)} : 1 contrast</p>
            <p className="text-xs text-neutral-500 mt-1">{ratio >= 7 ? 'aaa body' : ratio >= 4.5 ? 'aa body' : ratio >= 3 ? 'large type only' : 'too soft'}</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
