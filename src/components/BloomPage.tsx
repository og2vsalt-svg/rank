import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Shot = { id: string; name: string; url: string; size: number };

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function BloomPage() {
  const [shots, setShots] = useState<Shot[]>([]);
  const [warn, setWarn] = useState('');

  const onFiles = (list: FileList | null) => {
    if (!list?.length) return;
    const files = Array.from(list).filter((f) => f.type.startsWith('image/'));
    const total = files.reduce((n, f) => n + f.size, 0);
    setWarn(total > 30 * 1024 * 1024 ? 'big bloom. the browser may hitch while decoding. no hard cap.' : '');
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setShots((prev) => [...prev, { id: uid(), name: file.name, url: String(reader.result || ''), size: file.size }]);
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm mb-2">bloom</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">local photo wall.</h1>
          <p className="text-sm text-neutral-500 mb-6">drop images onto the page. they stay in this tab. nothing is uploaded unless you take them to wick or drop.</p>
          <label className="block cursor-pointer rounded-[28px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center transition mb-8">
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">add photos</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mb-4">{warn}</p>}
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-3">
            {shots.map((s) => (
              <motion.figure key={s.id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="mb-3 break-inside-avoid overflow-hidden rounded-[22px] bg-white/5">
                <img src={s.url} alt={s.name} className="w-full block" />
                <figcaption className="px-3 py-2 text-[11px] text-neutral-500 truncate">{s.name}</figcaption>
              </motion.figure>
            ))}
          </div>
          {shots.length > 0 && (
            <button onClick={() => setShots([])} className="mt-6 px-5 py-2.5 rounded-full bg-white/5 text-sm">clear wall</button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
