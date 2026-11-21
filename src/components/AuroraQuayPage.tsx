import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

type QuayItem = {
  file: File;
  id: string;
  note: string;
  accent: string;
  status: 'queued' | 'uploading' | 'done' | 'error';
  link?: string;
  error?: string;
  preview?: string;
};

export default function AuroraQuayPage() {
  const [items, setItems] = useState<QuayItem[]>([]);
  const [sharedNote, setSharedNote] = useState('');
  const [sharedAccent, setSharedAccent] = useState('#BF5AF2');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    const total = arr.reduce((s, f) => s + f.size, 0);
    setWarn(total > 50_000_000 ? 'Large aurora quay — uploads may feel slower. No hard limits.' : null);
    const next: QuayItem[] = arr.map((file) => ({
      file,
      id: Math.random().toString(36).slice(2, 10),
      note: '',
      accent: sharedAccent,
      status: 'queued',
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));
    setItems((p) => [...p, ...next]);
  }, [sharedAccent]);

  const updateItem = (id: string, patch: Partial<QuayItem>) => {
    setItems((p) => p.map((i) => i.id === id ? { ...i, ...patch } : i));
  };

  const publish = async () => {
    if (!items.length || busy) return;
    setBusy(true);
    for (const item of items) {
      if (item.status === 'done') continue;
      setItems((p) => p.map((i) => i.id === item.id ? { ...i, status: 'uploading' } : i));
      try {
        const caption = [sharedNote, item.note].filter(Boolean).join(' · ');
        const res = await publishLocalFile(item.file, {
          caption: caption || item.file.name,
          color: item.accent || sharedAccent,
          cardTitle: item.file.name,
          meta: { desk: 'auroraquay', sharedNote },
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
      <div className="pt-28 pb-24 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[40px] p-8 md:p-12"
        >
          <p className="text-[13px] font-medium tracking-wide mb-2" style={{ color: sharedAccent }}>Aurora Quay</p>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-3">Berth under the lights.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            A luminous quay for multiple files. Share a note across the berth, give each its own accent, and publish polished Discord embeds. Soft size warnings only — never hard limits. Sleek spring animations.
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
            <p className="text-neutral-300 text-[15px]">Drop files to berth</p>
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
            value={sharedNote}
            onChange={(e) => setSharedNote(e.target.value)}
            placeholder="Shared note for the aurora quay (optional)"
            rows={2}
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition resize-none"
          />

          <div className="flex items-center gap-3 mb-6">
            <input type="color" value={sharedAccent} onChange={(e) => setSharedAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-500">Default accent</span>
          </div>

          {warn && <p className="text-[13px] text-amber-300/80 mb-5">{warn}</p>}

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
                <div className="flex items-start gap-4">
                  {item.preview ? (
                    <img src={item.preview} alt="" className="w-16 h-16 rounded-xl object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-white/5 grid place-items-center text-[11px] text-neutral-500">file</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.file.name}</p>
                    <p className="text-xs text-neutral-500">{(item.file.size / 1024 / 1024).toFixed(1)} MB · {item.status}</p>
                    <input
                      value={item.note}
                      onChange={(e) => updateItem(item.id, { note: e.target.value })}
                      placeholder="Per-item note"
                      className="mt-2 w-full bg-black/20 border border-white/8 rounded-xl px-3 py-2 text-xs text-white placeholder:text-neutral-600 focus:outline-none"
                    />
                    <div className="flex items-center gap-2 mt-2">
                      <input type="color" value={item.accent} onChange={(e) => updateItem(item.id, { accent: e.target.value })} className="w-6 h-6 rounded-full cursor-pointer border-0" />
                      <span className="text-[11px] text-neutral-500">accent</span>
                    </div>
                    {item.link && (
                      <a href={item.link} target="_blank" rel="noreferrer" className="text-xs text-blue-400 truncate block mt-1">{item.link}</a>
                    )}
                    {item.error && <p className="text-xs text-red-400 mt-1">{item.error}</p>}
                  </div>
                  <button
                    onClick={() => setItems((p) => p.filter((i) => i.id !== item.id))}
                    className="text-xs text-neutral-500 hover:text-white px-2 py-1"
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
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl mt-4"
            style={{ background: sharedAccent }}
          >
            {busy ? 'Berthing…' : items.length ? `Berth ${items.length} file${items.length === 1 ? '' : 's'}` : 'Drop files first'}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
