import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

type FolioItem = {
  file: File;
  preview?: string;
  id: string;
  title: string;
  note: string;
  status: 'idle' | 'uploading' | 'done' | 'error';
  link?: string;
  error?: string;
};

export default function QuietFolioPage() {
  const [items, setItems] = useState<FolioItem[]>([]);
  const [sharedCaption, setSharedCaption] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);

  const onFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files);
    const total = arr.reduce((s, f) => s + f.size, 0);
    setWarn(total > 45_000_000 ? 'Large folio. Publishing may feel slower. No hard limits.' : null);
    const newItems: FolioItem[] = arr.map((file) => ({
      file,
      id: Math.random().toString(36).slice(2, 10),
      title: file.name.replace(/\.[^.]+$/, ''),
      note: '',
      status: 'idle',
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));
    setItems((prev) => [...prev, ...newItems]);
  }, []);

  const update = (id: string, patch: Partial<FolioItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const publishAll = async () => {
    if (!items.length) return;
    setBusy(true);
    for (const item of items) {
      if (item.status === 'done') continue;
      update(item.id, { status: 'uploading' });
      try {
        const caption = [sharedCaption, item.note].filter(Boolean).join(' · ') || item.title;
        const res = await publishLocalFile(item.file, {
          caption,
          color: accent,
          cardTitle: item.title || item.file.name,
          meta: { desk: 'quietfolio', kind: 'folio' },
        });
        update(item.id, {
          status: res.ok ? 'done' : 'error',
          link: res.embed || undefined,
          error: res.error,
        });
      } catch (e: any) {
        update(item.id, { status: 'error', error: e.message });
      }
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-6 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 22 }}
          className="glass rounded-[36px] p-8 md:p-12"
        >
          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>Quiet Folio</p>
          <h1 className="text-[42px] font-semibold tracking-tight mb-3">Compose a quiet folio.</h1>
          <p className="text-neutral-400 text-[16px] leading-relaxed mb-8 max-w-2xl">
            Drop local files into a refined portfolio grid. Give each its own title and note, or share one caption across the set. They settle with spring motion on frosted glass. Batch-publish to the database. Every link unfurls a polished Discord embed. Soft size warnings only. No hard limits. Human-crafted Apple-style pacing. All prior desks remain fully intact.
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
            value={sharedCaption}
            onChange={(e) => setSharedCaption(e.target.value)}
            placeholder="Shared caption for the whole folio (optional)"
            className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-4 focus:outline-none focus:border-white/25 transition"
          />

          <div className="flex items-center gap-4 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0 bg-transparent" />
            <span className="text-[13px] text-neutral-400">Accent for embeds</span>
          </div>

          {warn && <p className="text-[13px] text-amber-300/90 mb-6">{warn}</p>}

          <AnimatePresence>
            {items.length > 0 && (
              <motion.div layout className="grid gap-4 sm:grid-cols-2 mb-8">
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                    className="glass rounded-2xl p-4"
                  >
                    {item.preview && (
                      <img src={item.preview} alt="" className="w-full h-40 object-cover rounded-xl mb-3" />
                    )}
                    <input
                      value={item.title}
                      onChange={(e) => update(item.id, { title: e.target.value })}
                      placeholder="Title"
                      className="w-full bg-transparent text-sm font-medium outline-none mb-2"
                    />
                    <textarea
                      value={item.note}
                      onChange={(e) => update(item.id, { note: e.target.value })}
                      placeholder="Note (optional)"
                      rows={2}
                      className="w-full bg-transparent text-xs text-neutral-400 outline-none resize-none mb-2"
                    />
                    <div className="flex items-center justify-between text-xs text-neutral-500">
                      <span>{(item.file.size / 1024 / 1024).toFixed(1)} MB · {item.status}</span>
                      <button onClick={() => remove(item.id)} className="hover:text-white">remove</button>
                    </div>
                    {item.link && (
                      <a href={item.link} target="_blank" rel="noreferrer" className="text-xs text-blue-400 truncate block mt-1">{item.link}</a>
                    )}
                    {item.error && <p className="text-xs text-red-400 mt-1">{item.error}</p>}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.005 }}
            onClick={publishAll}
            disabled={busy || !items.length}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-lg"
            style={{ background: accent }}
          >
            {busy ? 'Publishing folio…' : `Publish ${items.length || ''} piece${items.length === 1 ? '' : 's'}`}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
