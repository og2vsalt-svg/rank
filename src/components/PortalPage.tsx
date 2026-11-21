import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

type Item = {
  file: File;
  preview?: string;
  id: string;
  status: 'queued' | 'uploading' | 'done' | 'error';
  link?: string;
  error?: string;
};

export default function PortalPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    if (!selected && next[0]) setSelected(next[0].id);
  }, [selected]);

  const publish = async () => {
    if (!items.length || busy) return;
    setBusy(true);
    for (const item of items) {
      if (item.status === 'done') continue;
      setItems((p) => p.map((i) => i.id === item.id ? { ...i, status: 'uploading' } : i));
      try {
        const res = await publishLocalFile(item.file, {
          caption: caption.trim() || item.file.name,
          color: accent,
          cardTitle: item.file.name,
          meta: { desk: 'portal' },
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

  const current = items.find((i) => i.id === selected) || items[0];

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[40px] p-8 md:p-12 overflow-hidden"
        >
          <p className="text-[13px] font-medium tracking-wide mb-2" style={{ color: accent }}>Portal</p>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-3">Step through.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8 max-w-xl">
            An immersive drop. Files open into a large preview as they arrive. Every share carries a polished Discord embed. Soft size warnings only — never hard limits. Human-crafted Apple-style spring motion on frosted glass.
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
            <p className="text-neutral-300 text-[15px]">Drop files to open the portal</p>
            <p className="text-neutral-500 text-sm mt-1">or click to choose</p>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
          </div>

          {current && (
            <motion.div
              key={current.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 120, damping: 18 }}
              className="mb-8 rounded-3xl overflow-hidden bg-black/40 aspect-video grid place-items-center"
            >
              {current.preview ? (
                <img src={current.preview} alt="" className="max-w-full max-h-full object-contain" />
              ) : (
                <div className="text-center p-8">
                  <div className="text-4xl mb-2">📄</div>
                  <p className="text-neutral-300">{current.file.name}</p>
                  <p className="text-xs text-neutral-500 mt-1">{(current.file.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
              )}
            </motion.div>
          )}

          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional caption for the embed"
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition"
          />

          <div className="flex items-center gap-3 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-500">Accent for Discord embeds</span>
          </div>

          {warn && <p className="text-[13px] text-amber-300/80 mb-5">{warn}</p>}

          <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelected(item.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs transition ${
                  selected === item.id ? 'bg-white/15 text-white' : 'bg-white/5 text-neutral-400'
                }`}
              >
                {item.file.name.slice(0, 16)}{item.file.name.length > 16 ? '…' : ''}
              </button>
            ))}
          </div>

          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-3 flex items-center gap-3 mb-2 text-sm"
              >
                <div className="flex-1 min-w-0">
                  <p className="truncate">{item.file.name}</p>
                  <p className="text-xs text-neutral-500">{item.status}{(item.link ? ' · linked' : '')}</p>
                </div>
                {item.link && (
                  <a href={item.link} target="_blank" rel="noreferrer" className="text-xs text-blue-400">open</a>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || !items.length}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl mt-4"
            style={{ background: accent }}
          >
            {busy ? 'Opening portal…' : items.length ? `Share ${items.length} file${items.length === 1 ? '' : 's'}` : 'Drop a file first'}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
