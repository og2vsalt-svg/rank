import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';

export default function AperturePage() {
  const { files } = useVault();
  const images = useMemo(() => files.filter((f) => (f.type || '').startsWith('image/')), [files]);
  const [idx, setIdx] = useState(0);
  const current = images[idx];

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm mb-2">aperture</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">look closer at a vault photo.</h1>
          <p className="text-neutral-400 text-sm mb-8">slideshow over your own images. no upload cap. big raws just take a second to paint.</p>

          {!current ? (
            <p className="text-sm text-neutral-500">no pictures sitting in the vault. toss some in drop or vault first.</p>
          ) : (
            <>
              <div className="rounded-[28px] overflow-hidden bg-black/40 border border-white/8 mb-4">
                <img src={current.dataUrl} alt={current.name} className="w-full max-h-[70vh] object-contain" />
              </div>
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}
                  className="px-4 py-2 rounded-full bg-white/8 text-sm hover:bg-white/12 transition-colors"
                >prev</button>
                <p className="text-sm text-neutral-400 truncate">{current.name} · {idx + 1}/{images.length}</p>
                <button
                  onClick={() => setIdx((i) => (i + 1) % images.length)}
                  className="px-4 py-2 rounded-full bg-white text-black text-sm hover:bg-neutral-200 transition-colors"
                >next</button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
