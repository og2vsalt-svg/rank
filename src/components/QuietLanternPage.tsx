import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from './VaultContext';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

type LanternItem = {
  id: string;
  file: File;
  status: 'queued' | 'uploading' | 'done' | 'error';
  result?: { embed: string; warn?: string | null };
  error?: string;
};

export default function QuietLanternPage() {
  const { addFiles } = useVault();
  const [items, setItems] = useState<LanternItem[]>([]);
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#0A84FF');

  const onDrop = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list).map((file) => ({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      file,
      status: 'queued' as const,
    }));
    setItems((prev) => [...arr, ...prev]);
  }, []);

  const shareAll = async () => {
    const pending = items.filter((d) => d.status === 'queued');
    if (!pending.length) return;

    await addFiles(pending.map((d) => d.file), 'lantern');

    for (const d of pending) {
      setItems((prev) => prev.map((x) => (x.id === d.id ? { ...x, status: 'uploading' } : x)));
      try {
        const res = await publishLocalFile(d.file, {
          caption: caption || undefined,
          color,
          cardTitle: d.file.name,
          author: 'rankvault',
        });
        if (!res.ok || !res.id) {
          setItems((prev) =>
            prev.map((x) =>
              x.id === d.id ? { ...x, status: 'error', error: res.error || 'failed' } : x
            )
          );
          continue;
        }
        const urls = shareUrls(res.id);
        setItems((prev) =>
          prev.map((x) =>
            x.id === d.id
              ? { ...x, status: 'done', result: { embed: urls.embed, warn: res.warn || null } }
              : x
          )
        );
      } catch (e: any) {
        setItems((prev) =>
          prev.map((x) => (x.id === d.id ? { ...x, status: 'error', error: e?.message || 'error' } : x))
        );
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-white pt-24 px-5 pb-20">
      <div className="max-w-4xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="text-4xl font-semibold tracking-tight mb-2"
        >
          quiet lantern
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.08 }}
          className="text-neutral-400 mb-8 max-w-2xl"
        >
          Drop local files. They hang as soft glowing lanterns with gentle floating motion and spring animations on frosted glass. Share the lanterns to the database. Every link opens a polished Discord embed. Soft size warnings only — no hard limits. Prior desks stay intact.
        </motion.p>

        <div
          className="glass rounded-3xl p-12 mb-6 text-center cursor-pointer border border-white/10 hover:border-white/25 transition-all duration-300"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files) onDrop(e.dataTransfer.files);
          }}
        >
          <input type="file" onChange={(e) => e.target.files && onDrop(e.target.files)} className="hidden" id="lantern" multiple />
          <label htmlFor="lantern" className="cursor-pointer block">
            <div className="text-neutral-500 text-sm">drag files to hang the lanterns or click</div>
          </label>
        </div>

        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="optional shared caption for Discord cards"
          className="w-full glass rounded-2xl px-4 py-3 text-sm mb-4 outline-none"
        />

        <div className="flex items-center gap-3 mb-6">
          <span className="text-xs text-neutral-400">lantern glow</span>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-9 h-9 rounded-full border-0 cursor-pointer" />
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={shareAll}
          disabled={!items.some((d) => d.status === 'queued')}
          className="w-full max-w-md py-3 rounded-full bg-[#0A84FF] text-white font-medium disabled:opacity-40 mb-10"
        >
          light the lanterns
        </motion.button>

        <div className="flex flex-wrap gap-6 justify-center">
          <AnimatePresence>
            {items.map((d, i) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ type: 'spring', stiffness: 110, damping: 16, delay: i * 0.05 }}
                className="relative glass rounded-3xl p-5 w-64 border border-white/5 overflow-hidden"
                style={{ boxShadow: `0 0 40px ${color}22, inset 0 1px 0 rgba(255,255,255,0.1)` }}
              >
                <motion.div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 w-3 h-8 rounded-full"
                  style={{ background: color }}
                  animate={{ scaleY: [1, 1.08, 1] }}
                  transition={{ duration: 3 + (i % 3), repeat: Infinity, ease: 'easeInOut' }}
                />
                <div className="pt-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{d.file.name}</p>
                      <p className="text-xs text-neutral-500">{(d.file.size / 1024 / 1024).toFixed(1)} MB</p>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-neutral-400 shrink-0">{d.status}</span>
                  </div>
                  {d.status === 'done' && d.result && (
                    <div className="mt-2">
                      <p className="text-xs text-[#0A84FF] break-all line-clamp-2">{d.result.embed}</p>
                      {d.result.warn && <p className="text-amber-400 text-xs mt-1">{d.result.warn}</p>}
                      <button
                        onClick={() => navigator.clipboard.writeText(d.result!.embed)}
                        className="text-xs text-neutral-400 mt-2 hover:text-white"
                      >
                        copy link
                      </button>
                    </div>
                  )}
                  {d.status === 'error' && <p className="text-red-400 text-xs mt-1">{d.error}</p>}
                  {d.file.size > 40 * 1024 * 1024 && d.status === 'queued' && (
                    <p className="text-amber-400 text-xs mt-2">large file — may feel slow. no hard limit.</p>
                  )}
                </div>
                <motion.div
                  className="absolute inset-0 pointer-events-none rounded-3xl"
                  style={{ background: `radial-gradient(circle at 50% 20%, ${color}18, transparent 60%)` }}
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 4 + (i % 2), repeat: Infinity, ease: 'easeInOut' }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
          {!items.length && (
            <div className="text-neutral-500 text-sm py-12">the lanterns are unlit</div>
          )}
        </div>
      </div>
    </div>
  );
}
