import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function PrismPage() {
  const [src, setSrc] = useState('');
  const [meta, setMeta] = useState('');
  const [hex, setHex] = useState('#0a84ff');
  const [warn, setWarn] = useState('');

  function onFile(f?: File) {
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setWarn('needs a still');
      return;
    }
    setWarn(f.size > 40 * 1024 * 1024 ? 'big still — preview might feel sleepy' : '');
    const url = URL.createObjectURL(f);
    setSrc(url);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      const w = Math.min(48, img.width);
      const h = Math.max(1, Math.round((img.height / img.width) * w));
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;
      let r = 0, g = 0, b = 0, n = 0;
      for (let i = 0; i < data.length; i += 4) {
        r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
      }
      const rr = Math.round(r / n), gg = Math.round(g / n), bb = Math.round(b / n);
      const hxc = '#' + [rr, gg, bb].map((v) => v.toString(16).padStart(2, '0')).join('');
      setHex(hxc);
      setMeta(`${img.width}×${img.height} · ${(f.size / 1024).toFixed(1)} kb · ${hxc}`);
    };
    img.src = url;
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-3">prism</p>
          <h1 className="text-3xl font-semibold text-white tracking-tight">read a still</h1>
          <p className="text-sm text-neutral-500 mt-2 mb-8">local preview + average color. not the vault.</p>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6">
            <label className="block rounded-2xl border border-dashed border-white/15 px-4 py-10 text-center text-sm text-neutral-400 cursor-pointer">
              drop an image
              <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
            {warn && <p className="text-xs text-amber-400/80 mt-3">{warn}</p>}
            {src && (
              <div className="mt-5 space-y-3">
                <img src={src} alt="" className="w-full rounded-2xl" />
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full border border-white/10" style={{ background: hex }} />
                  <p className="text-sm text-neutral-400">{meta}</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
