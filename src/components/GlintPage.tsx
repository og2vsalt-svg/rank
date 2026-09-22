import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';

export default function GlintPage() {
  const { files } = useVault();
  const images = useMemo(() => files.filter((f) => (f.type || '').startsWith('image/')), [files]);
  const [open, setOpen] = useState<string | null>(null);
  const current = images.find((f) => f.id === open);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm mb-2">glint</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">vault images, apple-soft.</h1>
          <p className="text-neutral-400 text-sm mb-8">not another vault. just a lightbox over the pictures already sitting in your files.</p>
          {images.length === 0 ? (
            <p className="text-sm text-neutral-500">no images in the vault yet. drop some in vault or drop first.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map((f) => (
                <button key={f.id} onClick={() => setOpen(f.id)} className="group relative overflow-hidden rounded-3xl aspect-square bg-white/5">
                  <img src={f.dataUrl} alt="" className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" />
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </div>
      <AnimatePresence>
        {current && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setOpen(null)}>
            <motion.img initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} src={current.dataUrl} alt={current.name} className="max-h-[86vh] max-w-full rounded-[28px] shadow-2xl" onClick={(e) => e.stopPropagation()} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
