import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';

export default function LumenPage() {
  const { files } = useVault();
  const stills = useMemo(() => files.filter((f) => f.type.startsWith('image/')), [files]);
  const [open, setOpen] = useState<string | null>(null);
  const current = stills.find((f) => f.id === open);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm mb-2">lumen</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">lightbox wall</h1>
          <p className="text-sm text-neutral-500 mb-8">stills already in the vault, not another dump tray. tap to float them.</p>
          {stills.length === 0 ? (
            <div className="glass rounded-[28px] p-8 text-sm text-neutral-500">no images in the vault yet. drop some in vault then come back.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {stills.map((f) => (
                <button key={f.id} onClick={() => setOpen(f.id)} className="group relative overflow-hidden rounded-2xl aspect-square bg-white/5">
                  <img src={f.dataUrl} alt="" className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]" />
                  <span className="absolute inset-x-0 bottom-0 p-2 text-[11px] text-white/80 bg-gradient-to-t from-black/60 to-transparent truncate">{f.name}</span>
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </div>
      <AnimatePresence>
        {current && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setOpen(null)}>
            <motion.img initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} src={current.dataUrl} alt="" className="max-h-[82vh] max-w-full rounded-3xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
