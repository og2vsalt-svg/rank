import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function LumenGalleryPage() {
  const [items, setItems] = useState<CloudMeta[]>([]);
  const [open, setOpen] = useState<CloudMeta | null>(null);

  useEffect(() => {
    listPublicShares(48).then((rows) => {
      setItems(rows.filter((r) => String(r.type || '').startsWith('image/')));
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#050506] text-white pt-24 px-5 pb-20">
      <div className="max-w-5xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="text-4xl sm:text-5xl font-semibold tracking-tight mb-3"
        >
          lumen gallery
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.08 }}
          className="text-neutral-400 mb-10 max-w-lg"
        >
          Soft light on shared images. Tap any piece to expand. All prior desks remain. Discord embeds on every link.
        </motion.p>

        <div className="columns-2 sm:columns-3 gap-4 space-y-4">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, type: 'spring', stiffness: 120, damping: 22 }}
              className="break-inside-avoid glass rounded-2xl overflow-hidden cursor-pointer apple-card"
              onClick={() => setOpen(item)}
            >
              <img
                src={item.fileUrl || item.url}
                alt={item.name}
                className="w-full object-cover"
                loading="lazy"
              />
              {item.caption && (
                <div className="p-3 text-xs text-neutral-300">{item.caption}</div>
              )}
            </motion.div>
          ))}
        </div>

        {items.length === 0 && (
          <p className="text-neutral-500 text-sm mt-8">no shared images yet. drop one from direct share.</p>
        )}

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-6"
              onClick={() => setOpen(null)}
            >
              <motion.div
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.96, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 180, damping: 22 }}
                className="max-w-3xl w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <img src={open.fileUrl || open.url} alt={open.name} className="w-full rounded-3xl" />
                <div className="mt-4 glass rounded-2xl p-4">
                  <p className="font-medium">{open.name}</p>
                  {open.caption && <p className="text-sm text-neutral-400 mt-1">{open.caption}</p>}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
