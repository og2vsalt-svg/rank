import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function hexToRgb(hex: string) {
  const h = hex.replace('#', '').trim();
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  if (!/^[0-9a-fA-F]{6}$/.test(n)) return null;
  return {
    r: parseInt(n.slice(0, 2), 16),
    g: parseInt(n.slice(2, 4), 16),
    b: parseInt(n.slice(4, 6), 16),
  };
}

function lin(c: number) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function luminance(hex: string) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  return 0.2126 * lin(rgb.r) + 0.7152 * lin(rgb.g) + 0.0722 * lin(rgb.b);
}

function contrast(a: string, b: string) {
  const l1 = luminance(a);
  const l2 = luminance(b);
  if (l1 == null || l2 == null) return null;
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

export default function LumenPage() {
  const [fg, setFg] = useState('#f5f5f7');
  const [bg, setBg] = useState('#1c1c1e');
  const ratio = useMemo(() => contrast(fg, bg), [fg, bg]);
  const n = ratio ? ratio.toFixed(2) : '—';
  const aa = ratio != null && ratio >= 4.5;
  const aaa = ratio != null && ratio >= 7;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">lumen</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">how two colours sit together.</h1>
          <p className="text-neutral-400 text-sm mb-8">wcag contrast in the tab. nothing uploads. not a vault.</p>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <label className="text-xs text-neutral-500">
              type
              <input value={fg} onChange={(e) => setFg(e.target.value)} className="mt-1 w-full bg-white/5 rounded-2xl px-3 py-2 text-white text-sm outline-none" />
            </label>
            <label className="text-xs text-neutral-500">
              field
              <input value={bg} onChange={(e) => setBg(e.target.value)} className="mt-1 w-full bg-white/5 rounded-2xl px-3 py-2 text-white text-sm outline-none" />
            </label>
          </div>
          <div className="rounded-[24px] p-10 text-center transition-colors duration-500" style={{ background: hexToRgb(bg) ? bg : '#111', color: hexToRgb(fg) ? fg : '#fff' }}>
            <p className="text-2xl font-semibold tracking-tight">the quiet line</p>
            <p className="text-sm mt-2 opacity-80">sample copy for a card</p>
          </div>
          <div className="mt-6 flex items-center justify-between text-sm">
            <span className="text-neutral-400">contrast {n}:1</span>
            <span className="text-neutral-300">{aaa ? 'aaa body' : aa ? 'aa body' : 'fails body aa'}</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
