import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

type Item = {
  file: File;
  preview?: string;
  id: string;
  status: 'queued' | 'uploading' | 'done' | 'error';
  link?: string;
  error?: string;
};

export default function MistlinePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#64D2FF');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [recent, setRecent] = useState<CloudMeta[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listPublicShares(6).then(setRecent).catch(() => {});
  }, []);

  const addFiles = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    const total = arr.reduce((s, f) => s + f.size, 0);
    setWarn(total > 45_000_000 ? 'Large batch — uploads may feel slower. No hard limits.' : null);
    const next: Item[] = arr.map((file) => ({
      file,
      id: Math.random().toString(36).slice(2, 10),
      status: 'queued',
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));
    setItems((p) => [...p, ...next]);
  }, []);

  const publish = async () => {
    if (!items.length || busy) return;
    setBusy(true);
    for (const item of items) {
      if (item.status === 'done') continue;
      setItems((p) => p.map((i) => i.id === item.id ? { ...i, status: 'uploading' } : i));
      try {
        const res = await publishLocalFile(item.file, {
          caption: note.trim() || item.file.name,
          color: accent,
          cardTitle: item.file.name,
          meta: { desk: 'mistline' },
        });
        setItems((p) => p.map((i) =>
          i.id === item.id
            ? { ...i, status: res.ok ? 'done' : 'error', link: res.embed, error: res.error }
            : i
        ));
      } catch (e: any) {
        setItems((p) => p.map((i) => i.id === item.id ? { ...i, status: 'error', error: e.message } : i));
      }
    }
    setBusy(false);
    listPublicShares(6).then(setRecent).catch(() => {});
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 22 }}
          className="glass rounded-[36px] p-8 md:p-12 relative overflow-hidden"
        >
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{ background: `linear-gradient(180deg, ${accent}12 0%, transparent 40%)` }}
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />

          <p className="text-[13px] font-medium tracking-wide mb-2 relative" style={{ color: accent }}>Mistline</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 relative">Files settle in soft mist.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8 relative">
            Drop local files. A shared note drifts with them. They lift into storage and the public share table. Every link carries a polished Discord embed. Soft size warnings only — never hard limits. Apple-style springs on frosted glass.
          </p>

          <div
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-white/20'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('ring-2', 'ring-white/20')}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('ring-2', 'ring-white/20');
              if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-white/12 rounded-3xl p-14 text-center mb-7 cursor-pointer hover:border-white/25 transition bg-black/20 relative"
          >
            <p className="text-neutral-300 text-[15px]">Drop files here</p>
            <p className="text-neutral-500 text-sm mt-1">or click to choose</p>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional shared note — drifts with the mist"
            rows={2}
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition resize-none relative"
          />

          <div className="flex items-center gap-3 mb-6 relative">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-500">Accent for the embeds</span>
          </div>

          {warn && <p className="text-[13px] text-amber-300/80 mb-5 relative">{warn}</p>}

          <div className="space-y-3 relative">
            <AnimatePresence>
              {items.map((item, idx) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -20, scale: 0.96 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 240, damping: 22, delay: idx * 0.05 }}
                  className="glass rounded-2xl p-4 flex items-center gap-4"
                >
                  {item.preview ? (
                    <img src={item.preview} alt="" className="w-14 h-14 rounded-xl object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-white/5 grid place-items-center text-[11px] text-neutral-500">file</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.file.name}</p>
                    <p className="text-xs text-neutral-500">{(item.file.size / 1024 / 1024).toFixed(1)} MB · {item.status}</p>
                    {item.link && (
                      <a href={item.link} target="_blank" rel="noreferrer" className="text-xs text-blue-400 truncate block mt-0.5">{item.link}</a>
                    )}
                    {item.error && <p className="text-xs text-red-400 mt-0.5">{item.error}</p>}
                  </div>
                  <button
                    onClick={() => setItems((p) => p.filter((i) => i.id !== item.id))}
                    className="text-xs text-neutral-500 hover:text-white px-2"
                  >
                    remove
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || !items.length}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl mt-6 relative"
            style={{ background: accent }}
          >
            {busy ? 'Settling the mist…' : items.length ? `Share ${items.length} file${items.length === 1 ? '' : 's'}` : 'Drop a file first'}
          </motion.button>
        </motion.div>

        {recent.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, type: 'spring', stiffness: 100, damping: 20 }}
            className="mt-10"
          >
            <h2 className="text-sm text-neutral-400 mb-4 tracking-wide">recent public drops</h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {recent.map((r) => (
                <a key={r.id} href={`/s/${r.id}`} className="glass rounded-2xl p-4 min-w-[160px] block hover:scale-[1.02] transition-transform shrink-0">
                  <p className="text-sm font-medium truncate">{r.name}</p>
                  {r.caption && <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{r.caption}</p>}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
