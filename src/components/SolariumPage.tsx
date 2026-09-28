import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';

type Shot = { id: string; name: string; url: string; size: number };

function formatBytes(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

export default function SolariumPage() {
  const [shots, setShots] = useState<Shot[]>([]);
  const [open, setOpen] = useState<Shot | null>(null);
  const [warn, setWarn] = useState('');

  const add = (list: FileList | null) => {
    if (!list?.length) return;
    const next: Shot[] = [];
    let heavy = false;
    Array.from(list).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      if (file.size > 20 * 1024 * 1024) heavy = true;
      next.push({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        name: file.name,
        url: URL.createObjectURL(file),
        size: file.size,
      });
    });
    setWarn(heavy ? 'some stills are large. this tab may feel slow. no hard cap.' : '');
    setShots((prev) => [...next, ...prev]);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5">
        <div className="max-w-5xl mx-auto">
          <p className="text-[#0a84ff] text-sm mb-2">solarium</p>
          <h1 className="text-4xl font-semibold tracking-tight text-white mb-3">a sun room for stills.</h1>
          <p className="text-neutral-400 text-sm mb-8 max-w-xl">local images only. nothing uploads. not a vault — just a quiet lightbox on this device.</p>
          <label className="inline-flex items-center px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium cursor-pointer mb-8 hover:bg-neutral-200 transition-colors">
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => add(e.target.files)} />
            bring stills in
          </label>
          {warn && <p className="text-amber-300/80 text-xs mb-6">{warn}</p>}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {shots.map((s, i) => (
              <motion.button
                key={s.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: Math.min(i, 8) * 0.03, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => setOpen(s)}
                className="aspect-square rounded-2xl overflow-hidden bg-black/30 text-left"
              >
                <img src={s.url} alt="" className="w-full h-full object-cover" />
              </motion.button>
            ))}
          </div>
          {!shots.length && <p className="text-neutral-600 text-sm">empty room.</p>}
        </div>
      </main>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-xl flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(null)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-3xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={open.url} alt="" className="w-full max-h-[70vh] object-contain rounded-3xl" />
              <p className="text-white text-sm mt-4">{open.name}</p>
              <p className="text-neutral-500 text-xs">{formatBytes(open.size)}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
