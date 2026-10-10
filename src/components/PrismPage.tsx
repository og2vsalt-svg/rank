import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function PrismPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const addImages = (list: FileList | null) => {
    if (!list) return;
    setBusy(true);
    Array.from(list).forEach(f => {
      if (!f.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => setImages(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(f);
    });
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-24 pb-20 px-5 max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 110, damping: 16 }}>
          <p className="text-[#0A84FF] text-sm font-medium mb-2 tracking-wide">prism</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-3">scatter light across your files.</h1>
          <p className="text-neutral-400 max-w-xl mb-8">Drop images to build a living mosaic. Different from the vault — pure visual play, with the same smooth Apple motion. Large sets get a quiet warning if the tab starts to feel heavy.</p>
        </motion.div>

        <div
          className="glass rounded-3xl p-10 text-center border border-dashed border-white/10 hover:border-[#0A84FF]/30 transition mb-8 cursor-pointer"
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); addImages(e.dataTransfer.files); }}
        >
          <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={e => addImages(e.target.files)} />
          <p className="text-white">Drop images to grow the prism</p>
          <p className="text-xs text-neutral-500 mt-1">{busy ? 'refracting…' : 'any number. no hard limit.'}</p>
        </div>

        {images.length > 0 && (
          <motion.div
            className="columns-2 sm:columns-3 md:columns-4 gap-4 space-y-4"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
          >
            {images.map((src, i) => (
              <motion.img
                key={i}
                src={src}
                alt=""
                className="w-full rounded-2xl break-inside-avoid apple-card"
                variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                transition={{ type: 'spring', stiffness: 140, damping: 18 }}
              />
            ))}
          </motion.div>
        )}

        {images.length > 12 && <p className="text-xs text-amber-300/70 mt-6 text-center">Lots of light in the prism — tab may feel a touch slower. Still no cutoff.</p>}
      </div>
    </div>
  );
}
