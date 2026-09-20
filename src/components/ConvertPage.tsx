import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

const targets = ['image/png', 'image/jpeg', 'image/webp'] as const;

export default function ConvertPage() {
  const [out, setOut] = useState<string | null>(null);
  const [name, setName] = useState('converted');
  const [fmt, setFmt] = useState<(typeof targets)[number]>('image/png');
  const [warn, setWarn] = useState('');

  const run = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setWarn('this desk only remaps images in-browser. drop a png/jpg/webp/gif.');
      return;
    }
    if (file.size > 40 * 1024 * 1024) setWarn('big image. encode might stall the tab for a sec. no cap tho.');
    else setWarn('');
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      setOut(c.toDataURL(fmt, 0.92));
      setName(file.name.replace(/\.[^.]+$/, '') + '.' + fmt.split('/')[1]);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">convert</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">remap an image, stay local.</h1>
          <p className="text-neutral-400 text-sm mb-6">canvas encode only. nothing hits the vault unless you save it yourself.</p>
          <div className="flex flex-wrap gap-2 mb-5">
            {targets.map((t) => (
              <button key={t} onClick={() => setFmt(t)} className={`px-4 py-1.5 rounded-full text-sm ${fmt === t ? 'bg-white text-black' : 'bg-white/5 text-neutral-300'}`}>
                {t.split('/')[1]}
              </button>
            ))}
          </div>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => run(e.target.files?.[0])} />
            <p className="text-white font-medium">drop an image</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {out && (
            <div className="mt-6">
              <img src={out} alt="" className="w-full rounded-2xl mb-4" />
              <a href={out} download={name} className="inline-flex px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">download {name}</a>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
