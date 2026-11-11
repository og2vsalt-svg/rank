import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from './VaultContext';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

type RibbonItem = {
  id: string;
  file: File;
  status: 'queued' | 'uploading' | 'done' | 'error';
  result?: { embed: string; warn?: string | null };
  error?: string;
};

export default function QuietRibbonPage() {
  const { addFiles } = useVault();
  const [items, setItems] = useState<RibbonItem[]>([]);
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#0A84FF');
  const ribbonRef = useRef<HTMLDivElement>(null);

  const onDrop = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list).map((file) => ({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      file,
      status: 'queued' as const,
    }));
    setItems((prev) => [...arr, ...prev]);
    // gentle scroll into view
    setTimeout(() => ribbonRef.current?.scrollTo({ left: 0, behavior: 'smooth' }), 80);
  }, []);

  const shareAll = async () => {
    const pending = items.filter((d) => d.status === 'queued');
    if (!pending.length) return;

    await addFiles(pending.map((d) => d.file), 'ribbon');

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
      <div className="max-w-5xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="text-4xl font-semibold tracking-tight mb-2"
        >
          quiet ribbon
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.08 }}
          className="text-neutral-400 mb-8 max-w-2xl"
        >
          Drop local files. They settle into a flowing ribbon of frosted glass cards with soft spring motion. Share each or the whole ribbon to the database. Every link opens a polished Discord embed. Soft size warnings only — no hard limits. Prior desks stay intact.
        </motion.p>

        <div
          className="glass rounded-3xl p-12 mb-6 text-center cursor-pointer border border-white/10 hover:border-white/25 transition-all duration-300"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files) onDrop(e.dataTransfer.files);
          }}
        >
          <input type="file" onChange={(e) => e.target.files && onDrop(e.target.files)} className="hidden" id="ribbon" multiple />
          <label htmlFor="ribbon" className="cursor-pointer block">
            <div className="text-neutral-500 text-sm">drag files onto the ribbon or click</div>
          </label>
        </div>

        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="optional shared caption for Discord cards"
          className="w-full glass rounded-2xl px-4 py-3 text-sm mb-4 outline-none"
        />

        <div className="flex items-center gap-3 mb-6">
          <span className="text-xs text-neutral-400">accent</span>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-9 h-9 rounded-full border-0 cursor-pointer" />
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={shareAll}
          disabled={!items.some((d) => d.status === 'queued')}
          className="w-full max-w-md py-3 rounded-full bg-[#0A84FF] text-white font-medium disabled:opacity-40 mb-10"
        >
          share the ribbon
        </motion.button>

        <div
          ref={ribbonRef}
          className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'thin' }}
        >
          <AnimatePresence>
            {items.map((d, i) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, x: 40, scale: 0.94 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 120, damping: 18, delay: i * 0.04 }}
                className="glass rounded-3xl p-5 min-w-[260px] max-w-[280px] snap-start border border-white/5 shrink-0"
              >
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
              </motion.div>
            ))}
          </AnimatePresence>
          {!items.length && (
            <div className="text-neutral-500 text-sm py-8">the ribbon is empty</div>
          )}
        </div>
      </div>
    </div>
  );
}
