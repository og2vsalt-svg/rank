import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

type Item = {
  file: File;
  preview?: string;
  id: string;
  progress: number;
  status: 'queued' | 'uploading' | 'done' | 'error';
  link?: string;
  error?: string;
};

export default function QuietHarborPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#5AC8FA');
  const [busy, setBusy] = useState(false);
  const [globalWarn, setGlobalWarn] = useState<string | null>(null);

  const onFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files);
    const total = arr.reduce((s, f) => s + f.size, 0);
    setGlobalWarn(total > 50_000_000 ? 'Large batch. Uploads may feel slower. No hard limits.' : null);
    const newItems: Item[] = arr.map((file) => ({
      file,
      id: Math.random().toString(36).slice(2, 10),
      progress: 0,
      status: 'queued',
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));
    setItems((prev) => [...prev, ...newItems]);
  }, []);

  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const publishAll = async () => {
    if (!items.length) return;
    setBusy(true);
    for (const item of items) {
      if (item.status === 'done') continue;
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: 'uploading', progress: 12 } : i)));
      try {
        const res = await publishLocalFile(item.file, {
          caption: caption.trim() || item.file.name,
          color: accent,
          cardTitle: item.file.name,
          meta: { desk: 'quietharbor', kind: item.file.type.split('/')[0] || 'file' },
        });
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, status: res.ok ? 'done' : 'error', progress: 100, link: res.embed || undefined, error: res.error }
              : i,
          ),
        );
      } catch (e: any) {
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: 'error', error: e.message } : i)));
      }
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 22 }}
          className="glass rounded-[36px] p-8 md:p-12 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute inset-0 pointer-events-none opacity-30">
            <div className="absolute top-8 left-12 w-2 h-2 rounded-full" style={{ background: accent, boxShadow: `0 0 20px ${accent}` }} />
            <div className="absolute top-16 right-20 w-1.5 h-1.5 rounded-full" style={{ background: accent, boxShadow: `0 0 16px ${accent}` }} />
            <div className="absolute bottom-24 left-1/3 w-1 h-1 rounded-full" style={{ background: accent }} />
          </div>

          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>
            Quiet Harbor
          </p>
          <h1 className="text-[40px] font-semibold tracking-tight mb-3">Settle at the waterline.</h1>
          <p className="text-neutral-400 text-[16px] leading-relaxed mb-8 max-w-2xl">
            Drop local files. Soft lantern lights rise and settle on frosted glass like boats at rest in a quiet harbor. Shared caption, accent color, spring motion. Batch-publish to the database. Every link unfurls a polished Discord embed. Soft size warnings only. No hard limits. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting.
          </p>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add('ring-2', 'ring-white/20');
            }}
            onDragLeave={(e) => e.currentTarget.classList.remove('ring-2', 'ring-white/20')}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('ring-2', 'ring-white/20');
              if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
            }}
            className="border-2 border-dashed border-white/15 rounded-3xl p-12 text-center mb-8 transition hover:border-white/25 bg-black/10"
          >
            <p className="text-neutral-300 mb-4">Drop files into the harbor or</p>
            <label className="inline-block px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/15 cursor-pointer text-sm font-medium transition">
              choose files
              <input type="file" multiple className="hidden" onChange={(e) => e.target.files && onFiles(e.target.files)} />
            </label>
          </div>

          {globalWarn && <p className="text-amber-300/80 text-sm mb-4">{globalWarn}</p>}

          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Shared caption (optional)"
              className="flex-1 bg-black/20 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-white/20"
            />
            <label className="flex items-center gap-2 text-sm text-neutral-400">
              accent
              <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full border-0 cursor-pointer" />
            </label>
          </div>

          <AnimatePresence>
            {items.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 mb-8">
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="glass rounded-2xl p-4 flex items-center gap-4"
                  >
                    {item.preview ? (
                      <img src={item.preview} alt="" className="w-12 h-12 object-cover rounded-xl" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-white/5 grid place-items-center text-xs text-neutral-500">file</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{item.file.name}</p>
                      <p className="text-xs text-neutral-500">
                        {(item.file.size / 1024 / 1024).toFixed(1)} MB · {item.status}
                      </p>
                      {item.link && (
                        <a href={item.link} className="text-xs text-blue-400 truncate block" target="_blank" rel="noreferrer">
                          {item.link}
                        </a>
                      )}
                      {item.error && <p className="text-xs text-red-400">{item.error}</p>}
                    </div>
                    <button onClick={() => remove(item.id)} className="text-neutral-500 hover:text-white text-sm">
                      remove
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {items.length > 0 && (
            <button
              onClick={publishAll}
              disabled={busy}
              className="w-full sm:w-auto px-8 py-3 rounded-full bg-white text-black font-medium text-sm hover:bg-white/90 disabled:opacity-50 transition"
            >
              {busy ? 'settling…' : 'publish to harbor'}
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
