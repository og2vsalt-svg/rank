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

export default function QuietDropPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
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
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: 'uploading', progress: 10 } : i));
      try {
        const res = await publishLocalFile(item.file, {
          caption: caption.trim() || item.file.name,
          color: accent,
          cardTitle: item.file.name,
          meta: { desk: 'quietdrop', kind: item.file.type.split('/')[0] || 'file' },
        });
        setItems((prev) => prev.map((i) =>
          i.id === item.id
            ? { ...i, status: res.ok ? 'done' : 'error', progress: 100, link: res.embed || undefined, error: res.error }
            : i
        ));
      } catch (e: any) {
        setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: 'error', error: e.message } : i));
      }
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[32px] p-8 md:p-12 shadow-2xl"
        >
          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>Quiet Drop</p>
          <h1 className="text-[40px] font-semibold tracking-tight mb-3">Drop anything.</h1>
          <p className="text-neutral-400 text-[16px] leading-relaxed mb-8 max-w-2xl">
            A clean central place for files. Drag or choose local files. They settle with spring motion on frosted glass. Shared caption, accent color, live previews. Batch publish to the database. Every link unfurls a polished Discord embed. Soft size warnings only. No hard limits. Human-crafted Apple-style pacing. All prior desks remain fully intact.
          </p>

          <div
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-white/20'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('ring-2', 'ring-white/20')}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('ring-2', 'ring-white/20');
              if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
            }}
            className="border-2 border-dashed border-white/15 rounded-3xl p-12 text-center mb-8 transition hover:border-white/25 bg-black/10"
          >
            <p className="text-neutral-300 mb-4">Drop files here or</p>
            <label className="inline-block px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/15 cursor-pointer text-sm font-medium transition">
              choose files
              <input type="file" multiple className="hidden" onChange={(e) => e.target.files && onFiles(e.target.files)} />
            </label>
          </div>

          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Shared caption (optional)"
            className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-4 focus:outline-none focus:border-white/25 transition"
          />

          <div className="flex items-center gap-4 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0 bg-transparent" />
            <span className="text-[13px] text-neutral-400">Accent color for embeds</span>
          </div>

          {globalWarn && <p className="text-[13px] text-amber-300/90 mb-6">{globalWarn}</p>}

          <AnimatePresence>
            {items.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 mb-8">
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    className="glass rounded-2xl p-4 flex items-center gap-4"
                  >
                    {item.preview ? (
                      <img src={item.preview} alt="" className="w-16 h-16 rounded-xl object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-white/5 grid place-items-center text-xs text-neutral-500">file</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.file.name}</p>
                      <p className="text-xs text-neutral-500">{(item.file.size / 1024 / 1024).toFixed(1)} MB · {item.status}</p>
                      {item.link && <a href={item.link} target="_blank" rel="noreferrer" className="text-xs text-blue-400 truncate block">{item.link}</a>}
                      {item.error && <p className="text-xs text-red-400">{item.error}</p>}
                    </div>
                    <button onClick={() => remove(item.id)} className="text-xs text-neutral-500 hover:text-white">remove</button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.01 }}
            onClick={publishAll}
            disabled={busy || !items.length}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-lg"
            style={{ background: accent }}
          >
            {busy ? 'Publishing…' : `Publish ${items.length || ''} file${items.length === 1 ? '' : 's'}`}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
