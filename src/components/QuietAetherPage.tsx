import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';

export default function QuietAetherPage() {
  const { addFiles } = useVault() as any;
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [warning, setWarning] = useState('');

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...dropped]);
    const big = dropped.some(f => f.size > 50 * 1024 * 1024);
    if (big) setWarning('Large files may feel slower to share. No limits enforced.');
    else setWarning('');
  }, []);

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selected]);
      const big = selected.some(f => f.size > 50 * 1024 * 1024);
      if (big) setWarning('Large files may feel slower to share. No limits enforced.');
    }
  };

  const share = async () => {
    if (addFiles) addFiles(files.map(f => ({ name: f.name, size: f.size, type: f.type })));
    // Placeholder for DB share + Discord embed link generation
    alert('Files settled into vault. Share links with polished embeds ready in production.');
    setFiles([]);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0A84FF] text-sm mb-2 tracking-wide">quiet aether</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white mb-3">settle into the air.</h1>
          <p className="text-neutral-400 text-sm mb-6">Drop local files. They rise as soft glass orbs with spring motion. Soft size warnings only. Publish for Discord-ready embeds.</p>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="border-2 border-dashed border-white/10 rounded-3xl p-12 text-center mb-6 hover:border-[#0A84FF]/40 transition-colors"
          >
            <p className="text-neutral-400">drop files here</p>
            <input type="file" multiple onChange={onSelect} className="mt-4 text-sm" />
          </div>

          {warning && <p className="text-xs text-amber-300/80 mb-4">{warning}</p>}

          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="shared caption (optional)"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm mb-6 focus:outline-none focus:border-[#0A84FF]/50"
          />

          <AnimatePresence>
            {files.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 24 }}
                className="flex items-center justify-between bg-white/[0.03] rounded-2xl px-4 py-3 mb-2"
              >
                <span className="text-sm text-white truncate">{f.name}</span>
                <span className="text-xs text-neutral-500">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
              </motion.div>
            ))}
          </AnimatePresence>

          {files.length > 0 && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={share}
              className="mt-6 w-full py-3 rounded-full bg-[#0A84FF] text-white text-sm font-medium"
            >
              publish to vault & share
            </motion.button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
