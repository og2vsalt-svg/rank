import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

type SeqItem = {
  file: File;
  preview?: string;
  id: string;
  caption: string;
  status: 'queued' | 'uploading' | 'done' | 'error';
  link?: string;
  error?: string;
};

export default function QuietSequencePage() {
  const [items, setItems] = useState<SeqItem[]>([]);
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    const total = arr.reduce((s, f) => s + f.size, 0);
    setWarn(total > 45_000_000 ? 'Large sequence — uploads may feel slower. No hard limits.' : null);
    const next: SeqItem[] = arr.map((file) => ({
      file,
      id: Math.random().toString(36).slice(2, 10),
      caption: '',
      status: 'queued',
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));
    setItems((p) => [...p, ...next]);
  }, []);

  const move = (id: string, dir: -1 | 1) => {
    setItems((p) => {
      const i = p.findIndex((x) => x.id === id);
      if (i < 0) return p;
      const j = i + dir;
      if (j < 0 || j >= p.length) return p;
      const next = [...p];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const publish = async () => {
    if (!items.length || busy) return;
    setBusy(true);
    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx];
      if (item.status === 'done') continue;
      setItems((p) => p.map((i) => i.id === item.id ? { ...i, status: 'uploading' } : i));
      try {
        const res = await publishLocalFile(item.file, {
          caption: item.caption.trim() || item.file.name,
          color: accent,
          cardTitle: `${idx + 1}. ${item.file.name}`,
          meta: { desk: 'sequence', order: idx + 1, total: items.length },
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
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 22 }}
          className="glass rounded-[36px] p-8 md:p-12"
        >
          <p className="text-[13px] font-medium tracking-wide mb-2" style={{ color: accent }}>Quiet Sequence</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">Filmstrip in order.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Drop local files in sequence. Reorder them, give each a quiet caption. They settle into the database as an ordered filmstrip. Every share link carries a polished Discord embed. Soft size warnings only — never hard limits. Apple-style spring motion on frosted glass.
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
            className="border-2 border-dashed border-white/12 rounded-3xl p-12 text-center mb-7 cursor-pointer hover:border-white/25 transition bg-black/20"
          >
            <p className="text-neutral-300 text-[15px]">Drop files to sequence</p>
            <p className="text-neutral-500 text-sm mt-1">or click to choose</p>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
          </div>

          <div className="flex items-center gap-3 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-500">Accent for the embeds</span>
          </div>

          {warn && <p className="text-[13px] text-amber-300/80 mb-5">{warn}</p>}

          {items.length > 0 && (
            <div className="mb-6 overflow-x-auto pb-4">
              <div className="flex gap-4 min-w-max">
                <AnimatePresence>
                  {items.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                      className="glass rounded-2xl p-3 w-48 flex-shrink-0"
                    >
                      <div className="text-[11px] text-neutral-500 mb-1">{idx + 1}</div>
                      {item.preview ? (
                        <img src={item.preview} alt="" className="w-full h-28 object-cover rounded-xl mb-2" />
                      ) : (
                        <div className="w-full h-28 rounded-xl bg-white/5 grid place-items-center text-[11px] text-neutral-500 mb-2">file</div>
                      )}
                      <input
                        value={item.caption}
                        onChange={(e) => setItems((p) => p.map((i) => i.id === item.id ? { ...i, caption: e.target.value } : i))}
                        placeholder="caption"
                        className="w-full bg-black/30 border border-white/10 rounded-xl px-2 py-1.5 text-xs text-white placeholder:text-neutral-500 mb-2"
                      />
                      <div className="flex justify-between text-xs">
                        <button onClick={() => move(item.id, -1)} className="text-neutral-400 hover:text-white">←</button>
                        <button onClick={() => setItems((p) => p.filter((i) => i.id !== item.id))} className="text-neutral-500 hover:text-white">×</button>
                        <button onClick={() => move(item.id, 1)} className="text-neutral-400 hover:text-white">→</button>
                      </div>
                      {item.link && <a href={item.link} target="_blank" rel="noreferrer" className="text-[10px] text-blue-400 truncate block mt-1">{item.link}</a>}
                      {item.error && <p className="text-[10px] text-red-400">{item.error}</p>}
                      <p className="text-[10px] text-neutral-500 mt-0.5">{item.status}</p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || !items.length}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl"
            style={{ background: accent }}
          >
            {busy ? 'Publishing sequence…' : items.length ? `Publish sequence of ${items.length}` : 'Drop files first'}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
