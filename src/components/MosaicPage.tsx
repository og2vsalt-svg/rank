import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Tile = { id: string; url: string; name: string; size: number };

export default function MosaicPage() {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [warn, setWarn] = useState('');

  const onFiles = (list: FileList | null) => {
    if (!list?.length) return;
    const next: Tile[] = [];
    let heavy = false;
    for (const file of Array.from(list)) {
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 25 * 1024 * 1024) heavy = true;
      next.push({
        id: `${file.name}-${file.size}-${Math.random()}`,
        url: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
      });
    }
    setWarn(heavy ? 'some frames are huge. the grid might feel sticky. no hard limit.' : '');
    setTiles((prev) => [...next, ...prev]);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-[#0a84ff] text-sm mb-2">mosaic</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">lay images on a quiet wall.</h1>
          <p className="text-neutral-400 text-sm mb-6">local only. a collage desk, not storage. nothing leaves the tab unless you drop it elsewhere.</p>
          <label className="block cursor-pointer rounded-[28px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center mb-8 transition">
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-sm text-neutral-300">drop stills here</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mb-4">{warn}</p>}
          <div className="columns-2 sm:columns-3 gap-3">
            {tiles.map((t, i) => (
              <motion.figure
                key={t.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: Math.min(i * 0.03, 0.3), ease: [0.22, 1, 0.36, 1] }}
                className="mb-3 break-inside-avoid overflow-hidden rounded-2xl border border-white/8"
              >
                <img src={t.url} alt={t.name} className="w-full block" />
              </motion.figure>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
