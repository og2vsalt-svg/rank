import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function WillowPage() {
  const [out, setOut] = useState('');
  const [name, setName] = useState('clean.png');
  const [warn, setWarn] = useState('');

  const onFile = (file?: File) => {
    if (!file) return;
    if (file.size > 40 * 1024 * 1024) setWarn('chunky image. canvas redraw might stall a sec. no cap.');
    else setWarn('');
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth || img.width;
      c.height = img.naturalHeight || img.height;
      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      setOut(c.toDataURL('image/png'));
      setName(file.name.replace(/\.[^.]+$/, '') + '-clean.png');
      URL.revokeObjectURL(url);
    };
    img.onerror = () => setWarn('could not read that as an image');
    img.src = url;
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">willow</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">strip the extra.</h1>
          <p className="text-neutral-400 text-sm mb-6">redraw a local photo onto a canvas so gps and camera tags fall off. stays on this device.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <p className="text-white font-medium">drop a photo</p>
            <p className="text-xs text-neutral-500 mt-2">png / jpg / webp. no upload.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {out && (
            <div className="mt-6 space-y-4">
              <img src={out} alt="" className="w-full rounded-2xl" />
              <a href={out} download={name} className="inline-flex px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">download clean png</a>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
