import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function QuiltPage() {
  const [shots, setShots] = useState<string[]>([]);
  const [warn, setWarn] = useState('');

  const onFiles = (list?: FileList | null) => {
    if (!list?.length) return;
    const files = [...list].filter((f) => f.type.startsWith('image/'));
    const heavy = files.find((f) => f.size > 20 * 1024 * 1024);
    setWarn(heavy ? `${heavy.name} is huge. no hard limit, the mosaic just might stutter.` : '');
    setShots(files.map((f) => URL.createObjectURL(f)));
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">quilt</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">lay stills into a local mosaic.</h1>
          <p className="text-neutral-400 text-sm mb-6">not a file vault. pick a handful of images and see them breathe together. nothing leaves the tab.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center">
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">add stills</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {shots.length > 0 && (
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {shots.map((src, i) => (
                <motion.img key={src} src={src} alt="" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }} className="w-full h-32 object-cover rounded-2xl" />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
