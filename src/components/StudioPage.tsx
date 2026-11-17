import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

type StudioItem = {
  file: File;
  preview?: string;
  id: string;
  status: 'queued' | 'uploading' | 'done' | 'error';
  link?: string;
  error?: string;
  caption: string;
  accent: string;
};

export default function StudioPage() {
  const [items, setItems] = useState<StudioItem[]>([]);
  const [globalCaption, setGlobalCaption] = useState('');
  const [globalAccent, setGlobalAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    const total = arr.reduce((s, f) => s + f.size, 0);
    setWarn(total > 45_000_000 ? 'Large batch — uploads may feel slower. No hard limits.' : null);
    const next: StudioItem[] = arr.map((file) => ({
      file,
      id: Math.random().toString(36).slice(2, 10),
      status: 'queued',
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      caption: file.name.replace(/\.[^.]+$/, ''),
      accent: globalAccent,
    }));
    setItems((p) => [...p, ...next]);
  }, [globalAccent]);

  const updateItem = (id: string, patch: Partial<StudioItem>) => {
    setItems((p) => p.map((i) => i.id === id ? { ...i, ...patch } : i));
  };

  const publish = async () => {
    if (!items.length || busy) return;
    setBusy(true);
    for (const item of items) {
      if (item.status === 'done') continue;
      setItems((p) => p.map((i) => i.id === item.id ? { ...i, status: 'uploading' } : i));
      try {
        const res = await publishLocalFile(item.file, {
          caption: item.caption.trim() || globalCaption.trim() || item.file.name,
          color: item.accent || globalAccent,
          cardTitle: item.file.name,
          meta: { desk: 'studio', individual: true },
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
          <p className="text-[13px] font-medium tracking-wide mb-2" style={{ color: globalAccent }}>Studio</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">Craft your shares.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Multi-file studio. Drop local files, give each its own caption and accent. They publish to the database with professional Discord embeds on every link. Soft size warnings only — never hard limits. Sleek Apple-style spring animations on frosted glass.
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
            className="border-2 border-dashed border-white/12 rounded-3xl p-14 text-center mb-7 cursor-pointer hover:border-white/25 transition bg-black/20"
          >
            <p className="text-neutral-300 text-[15px]">Drop files here</p>
            <p className="text-neutral-500 text-sm mt-1">or click to choose — each gets its own settings</p>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <input
              value={globalCaption}
              onChange={(e) => setGlobalCaption(e.target.value)}
              placeholder="Global caption (fallback)"
              className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30 transition"
            />
            <div className="flex items-center gap-3 bg-black/30 border border-white/10 rounded-2xl px-4 py-3">
              <input type="color" value={globalAccent} onChange={(e) => setGlobalAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0" />
              <span className="text-[13px] text-neutral-500">Default accent</span>
            </div>
          </div>

          {warn && <p className="text-[13px] text-amber-300/80 mb-5">{warn}</p>}

          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="glass rounded-2xl p-5 mb-4"
              >
                <div className="flex items-start gap-4">
                  {item.preview ? (
                    <img src={item.preview} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-white/5 grid place-items-center text-[11px] text-neutral-500 flex-shrink-0">file</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate mb-2">{item.file.name}</p>
                    <p className="text-xs text-neutral-500 mb-3">{(item.file.size / 1024 / 1024).toFixed(1)} MB · {item.status}</p>
                    <input
                      value={item.caption}
                      onChange={(e) => updateItem(item.id, { caption: e.target.value })}
                      placeholder="Caption for this file"
                      className="w-full bg-black/20 border border-white/8 rounded-xl px-3 py-2 text-sm text-white placeholder:text-neutral-600 mb-2 focus:outline-none focus:border-white/20"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={item.accent}
                        onChange={(e) => updateItem(item.id, { accent: e.target.value })}
                        className="w-8 h-8 rounded-full cursor-pointer border-0"
                      />
                      <span className="text-xs text-neutral-500">Accent</span>
                    </div>
                    {item.link && (
                      <a href={item.link} target="_blank" rel="noreferrer" className="text-xs text-blue-400 truncate block mt-2">{item.link}</a>
                    )}
                    {item.error && <p className="text-xs text-red-400 mt-1">{item.error}</p>}
                  </div>
                  <button
                    onClick={() => setItems((p) => p.filter((i) => i.id !== item.id))}
                    className="text-xs text-neutral-500 hover:text-white px-2 self-start"
                  >
                    remove
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || !items.length}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl mt-2"
            style={{ background: globalAccent }}
          >
            {busy ? 'Publishing…' : items.length ? `Publish ${items.length} file${items.length === 1 ? '' : 's'}` : 'Drop a file first'}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
