import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Tile = { name: string; url: string; size: number };

export default function MosaicPage() {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [warn, setWarn] = useState('');

  const onFiles = (list: FileList | null) => {
    if (!list?.length) return;
    const files = [...list].filter((f) => f.type.startsWith('image/'));
    if (files.some((f) => f.size > 25 * 1024 * 1024)) setWarn('a few frames are heavy. previews may lag.');
    else setWarn('');
    setTiles(files.map((f) => ({ name: f.name, url: URL.createObjectURL(f), size: f.size })));
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm mb-2">mosaic</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">lay images on a quiet board.</h1>
          <p className="text-sm text-neutral-500 mb-6">local only. useful before you decide what belongs in the vault.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center transition mb-6 glass">
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <span className="text-sm text-neutral-300">add stills</span>
          </label>
          {warn && <p className="text-amber-300/80 text-xs mb-4">{warn}</p>}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {tiles.map((t) => (
              <motion.figure key={t.url} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="overflow-hidden rounded-2xl bg-white/5 border border-white/10">
                <img src={t.url} alt={t.name} className="w-full h-40 object-cover" />
                <figcaption className="px-3 py-2 text-[12px] text-neutral-400 truncate">{t.name}</figcaption>
              </motion.figure>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
