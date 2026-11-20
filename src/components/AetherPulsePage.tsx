import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

type Item = {
  file: File;
  id: string;
  note: string;
  accent: string;
  status: 'queued' | 'uploading' | 'done' | 'error';
  link?: string;
  error?: string;
};

export default function AetherPulsePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [thread, setThread] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((list: FileList | File[]) => {
    const next: Item[] = Array.from(list).map((file) => ({
      file,
      id: Math.random().toString(36).slice(2, 10),
      note: '',
      accent: '#AF52DE',
      status: 'queued',
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
          caption: item.note.trim() || thread.trim() || item.file.name,
          color: item.accent,
          meta: { desk: 'aetherpulse', thread: thread.trim() || null },
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
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[36px] p-8 md:p-12"
        >
          <p className="text-[#AF52DE] text-[13px] font-medium tracking-wide mb-2">Aether Pulse</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">pulse and release.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Drop local files. Pulse each with its own note and accent. A thread binds them. Every share link carries a polished Discord embed. Soft size warnings only — never hard limits. Apple-style springs on frosted glass.
          </p>

          <div
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-[#AF52DE]/40'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('ring-2', 'ring-[#AF52DE]/40')}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('ring-2', 'ring-[#AF52DE]/40');
              if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-white/12 rounded-3xl p-14 text-center mb-7 cursor-pointer hover:border-white/25 transition bg-black/20"
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

          <input
            value={thread}
            onChange={(e) => setThread(e.target.value)}
            placeholder="Optional thread note for the whole drop"
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-6 focus:outline-none focus:border-white/30 transition"
          />

          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="glass rounded-2xl p-4 mb-3"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.file.name}</p>
                    <p className="text-xs text-neutral-500">
                      {(item.file.size / 1024 / 1024).toFixed(1)} MB · {item.status}
                    </p>
                  </div>
                  <input
                    type="color"
                    value={item.accent}
                    onChange={(e) => setItems((p) => p.map((i) => i.id === item.id ? { ...i, accent: e.target.value } : i))}
                    className="w-8 h-8 rounded-full border-0 cursor-pointer"
                  />
                </div>
                <input
                  value={item.note}
                  onChange={(e) => setItems((p) => p.map((i) => i.id === item.id ? { ...i, note: e.target.value } : i))}
                  placeholder="Note for this file"
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-neutral-500 mb-2 focus:outline-none"
                />
                {item.file.size > 40 * 1024 * 1024 && (
                  <p className="text-xs text-amber-300/70 mb-1">Large file — upload may feel slower. No hard limit.</p>
                )}
                {item.link && (
                  <a href={item.link} target="_blank" rel="noreferrer" className="text-xs text-[#AF52DE] break-all block">{item.link}</a>
                )}
                {item.error && <p className="text-xs text-red-400">{item.error}</p>}
                <button
                  onClick={() => setItems((p) => p.filter((i) => i.id !== item.id))}
                  className="text-xs text-neutral-500 hover:text-white mt-1"
                >
                  remove
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || !items.length}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl mt-2"
            style={{ background: '#AF52DE' }}
          >
            {busy ? 'Pulsing…' : items.length ? `Pulse ${items.length} file${items.length === 1 ? '' : 's'}` : 'Drop a file first'}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
