import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Shot = { id: string; url: string; name: string; size: number };

function pretty(n: number) {
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

export default function PollenPage() {
  const [shots, setShots] = useState<Shot[]>([]);
  const [warn, setWarn] = useState('');

  const onFiles = (list: FileList | null) => {
    if (!list?.length) return;
    const imgs = [...list].filter((f) => f.type.startsWith('image/'));
    const fat = imgs.some((f) => f.size > 40 * 1024 * 1024);
    setWarn(fat ? 'huge stills. the tab might hitch while they decode. no hard cap.' : '');
    imgs.forEach((f) => {
      const url = URL.createObjectURL(f);
      setShots((prev) => [...prev, { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), url, name: f.name, size: f.size }]);
    });
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm mb-2">pollen</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">scatter stills.</h1>
          <p className="text-sm text-neutral-500 mb-6">local moodboard. files stay in this tab. nothing gets capped except a slowness whisper.</p>
          <label className="block cursor-pointer rounded-[28px] border border-dashed border-white/15 hover:border-[#0a84ff]/40 p-8 text-center mb-8 transition" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}>
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white text-sm">drop images here</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mb-4">{warn}</p>}
          <div className="columns-2 sm:columns-3 gap-3">
            {shots.map((s, i) => (
              <motion.figure key={s.id} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03, duration: 0.4 }} className="mb-3 break-inside-avoid">
                <img src={s.url} alt="" className="w-full rounded-2xl" />
                <figcaption className="text-[11px] text-neutral-500 mt-1 truncate">{s.name} · {pretty(s.size)}</figcaption>
              </motion.figure>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
