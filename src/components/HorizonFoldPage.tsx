import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

type Item = {
  file: File;
  preview?: string;
  id: string;
  status: 'queued' | 'uploading' | 'done' | 'error';
  link?: string;
  error?: string;
  note: string;
};

export default function HorizonFoldPage() {
  const { navigate } = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    const total = arr.reduce((s, f) => s + f.size, 0);
    setWarn(total > 80_000_000 ? 'Large files may take a moment. Soft warning only — no hard limits.' : null);
    const next: Item[] = arr.map((file) => ({
      file,
      id: Math.random().toString(36).slice(2, 10),
      status: 'queued',
      note: '',
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
        const caption = [note.trim(), item.note.trim()].filter(Boolean).join(' · ') || item.file.name;
        const res = await publishLocalFile(item.file, {
          caption,
          color: '#5AC8FA',
          cardTitle: item.file.name,
          meta: { desk: 'horizonfold' },
        });
        const link = res.ok && res.id ? shareUrls(res.id).app : undefined;
        setItems((p) => p.map((i) =>
          i.id === item.id
            ? { ...i, status: res.ok ? 'done' : 'error', link, error: res.error }
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
          initial={{ opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 60, damping: 20 }}
          className="glass rounded-[40px] p-8 md:p-12 border border-white/5 relative overflow-hidden"
        >
          <motion.div
            className="absolute inset-x-0 bottom-0 h-px bg-[#5AC8FA]/40"
            animate={{ scaleX: [0.3, 1, 0.3] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />

          <p className="text-[13px] font-medium tracking-wide text-[#5AC8FA] mb-2 relative">Horizon Fold</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white relative">Rising layers.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8 relative">
            Drop local files into a rising horizon fold. Shared note, per-file notes, live previews. Soft size warnings only. Polished Discord embeds on every link. All prior desks remain fully intact.
          </p>

          <div
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-[#5AC8FA]/40'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('ring-2', 'ring-[#5AC8FA]/40')}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('ring-2', 'ring-[#5AC8FA]/40');
              if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-white/15 rounded-3xl p-16 text-center mb-7 cursor-pointer hover:border-white/30 transition bg-black/20 relative"
          >
            <p className="text-neutral-300 text-[15px]">Drop files into the fold</p>
            <p className="text-neutral-500 text-sm mt-1">or click to browse</p>
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
            placeholder="Optional shared note"
            rows={2}
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition resize-none relative"
          />

          {warn && <p className="text-[13px] text-amber-300/80 mb-5 relative">{warn}</p>}

          <AnimatePresence>
            {items.map((item, idx) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 30, rotateX: 12 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 140, damping: 18, delay: idx * 0.04 }}
                className="glass rounded-2xl p-4 flex flex-col gap-3 mb-3 border border-white/5 relative"
                style={{ perspective: 800 }}
              >
                <div className="flex items-center gap-4">
                  {item.preview ? (
                    <img src={item.preview} alt="" className="w-14 h-14 rounded-xl object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-white/5 grid place-items-center text-[11px] text-neutral-500">file</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-white">{item.file.name}</p>
                    <p className="text-xs text-neutral-500">{(item.file.size / 1024 / 1024).toFixed(1)} MB · {item.status}</p>
                    {item.link && (
                      <button onClick={() => navigate('share', item.link!.split('/').pop() || '')} className="text-xs text-[#5AC8FA] truncate block mt-0.5 text-left">{item.link}</button>
                    )}
                    {item.error && <p className="text-xs text-red-400 mt-0.5">{item.error}</p>}
                  </div>
                  <button
                    onClick={() => setItems((p) => p.filter((i) => i.id !== item.id))}
                    className="text-xs text-neutral-500 hover:text-white px-2"
                  >
                    remove
                  </button>
                </div>
                <input
                  value={item.note}
                  onChange={(e) => setItems((p) => p.map((i) => i.id === item.id ? { ...i, note: e.target.value } : i))}
                  placeholder="Optional note for this file"
                  className="w-full bg-black/20 border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/20"
                />
              </motion.div>
            ))}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.985 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || !items.length}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-black disabled:opacity-40 transition shadow-xl mt-2 bg-[#5AC8FA] relative"
          >
            {busy ? 'Folding…' : items.length ? `Share ${items.length} file${items.length === 1 ? '' : 's'}` : 'Drop a file first'}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
