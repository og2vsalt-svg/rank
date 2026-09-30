import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function hex(n: number) {
  return n.toString(16).padStart(2, '0');
}

export default function GladePage() {
  const [swatches, setSwatches] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [warn, setWarn] = useState('');

  const onFile = async (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    setName(f.name);
    setWarn(f.size > 30 * 1024 * 1024 ? 'big still. sampling may hitch. no hard cap.' : '');
    if (!f.type.startsWith('image/')) {
      setSwatches([]);
      setWarn('glade only samples images. nothing uploaded.');
      return;
    }
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 48;
      canvas.height = 48;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, 48, 48);
      const data = ctx.getImageData(0, 0, 48, 48).data;
      const buckets = new Map<string, number>();
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i] & 0xf0;
        const g = data[i + 1] & 0xf0;
        const b = data[i + 2] & 0xf0;
        const key = `#${hex(r)}${hex(g)}${hex(b)}`;
        buckets.set(key, (buckets.get(key) || 0) + 1);
      }
      setSwatches([...buckets.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([c]) => c));
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">glade</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">light from a still, kept in the tab.</h1>
          <p className="text-neutral-400 text-sm mb-6">samples a palette locally. nothing is uploaded. a clearing, not a vault.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 bg-white/[0.03] px-6 py-10 text-center hover:bg-white/[0.05]">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files)} />
            <span className="text-sm text-neutral-300">{name || 'drop a still into the glade'}</span>
          </label>
          {warn && <p className="mt-4 text-amber-300/90 text-sm">{warn}</p>}
          {swatches.length > 0 && (
            <div className="mt-6 grid grid-cols-6 gap-2">
              {swatches.map((c) => (
                <button key={c} onClick={() => navigator.clipboard.writeText(c).catch(() => {})} className="aspect-square rounded-2xl border border-white/10" style={{ background: c }} title={c} />
              ))}
            </div>
          )}
          {swatches.length > 0 && <p className="mt-3 text-xs text-neutral-500">{swatches.join('  ')} — tap a chip to copy</p>}
        </motion.div>
      </div>
    </div>
  );
}
