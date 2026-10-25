import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

function formatBytes(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

export default function SoftstillfieldPage() {
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [shares, setShares] = useState<{ id: string; name: string; size: number; embed: string; color: string }[]>([]);

  const onDrop = useCallback(async (files: FileList | null) => {
    if (!files?.length || busy) return;
    setBusy(true);
    setWarn(null);
    const next: typeof shares = [];
    for (const file of Array.from(files)) {
      if (file.size > 40 * 1024 * 1024) setWarn('large file. the upload may feel slow. no hard limit.');
      const res = await publishLocalFile(file, {
        caption: note || undefined,
        color: accent,
        cardTitle: file.name,
      });
      if (res.ok && res.id && res.embed) {
        next.push({ id: res.id, name: file.name, size: file.size, embed: res.embed, color: accent });
      }
    }
    setShares((prev) => [...next, ...prev]);
    setBusy(false);
  }, [note, accent, busy]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8 apple-in"
        >
          <p className="text-[#0a84ff] text-sm mb-2 tracking-wide">softstillfield</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a still field of shared light</h1>
          <p className="text-sm text-neutral-500 mb-6">Drop local files. They land in storage and the public shares table. Share links carry polished Discord embeds. Soft spring motion. Large files warned, never refused.</p>

          <div className="flex gap-3 mb-5">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="shared note (optional)"
              className="flex-1 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none"
            />
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="w-12 h-10 rounded-full border border-white/10 bg-transparent cursor-pointer"
              title="accent color"
            />
          </div>

          <label
            className="block border-2 border-dashed border-white/15 rounded-3xl p-12 text-center cursor-pointer hover:border-white/30 transition-colors"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onDrop(e.dataTransfer.files);
            }}
          >
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => onDrop(e.target.files)}
            />
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <p className="text-neutral-300 mb-1">drop files here, or click to choose</p>
              <p className="text-xs text-neutral-500">files upload to the database. no size caps.</p>
            </motion.div>
          </label>

          {warn && <p className="mt-4 text-xs text-amber-400/80">{warn}</p>}
          {busy && <p className="mt-4 text-sm text-neutral-400">placing into the field…</p>}

          <AnimatePresence>
            {shares.map((s) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                className="mt-4 glass rounded-2xl p-4 flex items-center justify-between gap-3"
                style={{ borderColor: s.color + '33' }}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-neutral-500">{formatBytes(s.size)}</p>
                </div>
                <a
                  href={s.embed}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 px-3 py-1.5 rounded-full text-xs bg-white/10 hover:bg-white/20 transition"
                >
                  share link
                </a>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
