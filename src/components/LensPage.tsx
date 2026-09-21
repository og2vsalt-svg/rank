import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function LensPage() {
  const [src, setSrc] = useState<string | null>(null);
  const [clean, setClean] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);
  const [name, setName] = useState('clean.png');

  const onPick = (file?: File) => {
    if (!file) return;
    setWarn(file.size > 25 * 1024 * 1024 ? 'big still. redrawing it may stall the tab for a second.' : null);
    setName(file.name.replace(/\.[^.]+$/, '') + '-clean.png');
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      setSrc(url);
      setClean(canvas.toDataURL('image/png'));
    };
    img.src = url;
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5">
        <div className="max-w-xl mx-auto">
          <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-3">lens</p>
          <h1 className="text-3xl font-semibold tracking-tight">strip still metadata</h1>
          <p className="text-sm text-neutral-500 mt-2 mb-8">redraws a photo onto a canvas so gps and camera tags fall off. stays in the tab.</p>
          <label className="block glass rounded-3xl p-10 text-center cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onPick(e.target.files?.[0])} />
            <p className="text-white font-medium">pick a still</p>
          </label>
          {warn && <p className="text-amber-400 text-xs mt-4">{warn}</p>}
          {clean && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 glass rounded-3xl p-5 space-y-4">
              <img src={clean} alt="" className="w-full rounded-2xl" />
              <a href={clean} download={name} className="inline-flex px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">download clean png</a>
              {src && <p className="text-xs text-neutral-500">original stayed local. we never uploaded it.</p>}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
