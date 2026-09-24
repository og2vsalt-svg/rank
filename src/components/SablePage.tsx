import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function SablePage() {
  const [left, setLeft] = useState<string | null>(null);
  const [right, setRight] = useState<string | null>(null);
  const [split, setSplit] = useState(50);
  const [warn, setWarn] = useState('');

  const load = (side: 'left' | 'right', file?: File) => {
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) setWarn('chunky image. preview might stutter. no cap tho.');
    else setWarn('');
    const r = new FileReader();
    r.onload = () => {
      const url = String(r.result || '');
      if (side === 'left') setLeft(url);
      else setRight(url);
    };
    r.readAsDataURL(file);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[28px] p-7"
        >
          <p className="text-[#0a84ff] text-sm mb-2">sable</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">darkroom compare</h1>
          <p className="text-sm text-neutral-500 mb-6">slide two local shots. nothing leaves this tab unless you drop it in harbor later.</p>

          <div className="grid sm:grid-cols-2 gap-3 mb-5">
            <label className="rounded-2xl border border-dashed border-white/15 p-4 text-center text-sm text-neutral-400 cursor-pointer hover:border-white/30">
              <input type="file" accept="image/*" className="hidden" onChange={(e) => load('left', e.target.files?.[0])} />
              {left ? 'swap left' : 'pick before'}
            </label>
            <label className="rounded-2xl border border-dashed border-white/15 p-4 text-center text-sm text-neutral-400 cursor-pointer hover:border-white/30">
              <input type="file" accept="image/*" className="hidden" onChange={(e) => load('right', e.target.files?.[0])} />
              {right ? 'swap right' : 'pick after'}
            </label>
          </div>

          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}

          {left && right && (
            <div className="relative overflow-hidden rounded-[24px] aspect-[16/10] bg-black">
              <img src={right} alt="after" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: split + '%' }}>
                <img src={left} alt="before" className="absolute inset-0 w-full h-full object-cover" style={{ width: `${10000 / split}%`, maxWidth: 'none' }} />
              </div>
              <div className="absolute inset-y-0 w-px bg-white/80" style={{ left: split + '%' }} />
              <input
                type="range"
                min={2}
                max={98}
                value={split}
                onChange={(e) => setSplit(Number(e.target.value))}
                className="absolute inset-x-4 bottom-4"
              />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
