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
  angle: number;
};

export default function LumenOrbitPage() {
  const { navigate } = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [sharedNote, setSharedNote] = useState('');
  const [accent, setAccent] = useState('#5AC8FA');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    const total = arr.reduce((s, f) => s + f.size, 0);
    setWarn(total > 48_000_000 ? 'Large batch — may feel slower while mapping. No hard limits.' : null);
    const base = items.length;
    const next: Item[] = arr.map((file, i) => ({
      file,
      id: Math.random().toString(36).slice(2, 10),
      status: 'queued',
      note: '',
      angle: (base + i) * (360 / Math.max(arr.length + base, 6)),
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));
    setItems((p) => [...p, ...next]);
  }, [items.length]);

  const publish = async () => {
    if (!items.length || busy) return;
    setBusy(true);
    for (const item of items) {
      if (item.status === 'done') continue;
      setItems((p) => p.map((i) => i.id === item.id ? { ...i, status: 'uploading' } : i));
      try {
        const caption = [sharedNote.trim(), item.note.trim()].filter(Boolean).join(' · ') || item.file.name;
        const res = await publishLocalFile(item.file, {
          caption,
          color: accent,
          cardTitle: item.file.name,
          meta: { desk: 'lumenorbit', sharedNote: sharedNote.trim() || null },
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
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 85, damping: 20 }}
          className="glass rounded-[42px] p-8 md:p-12 border border-white/5 relative overflow-hidden"
        >
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#5AC8FA]/10 rounded-full blur-3xl pointer-events-none" />
          <p className="text-[13px] font-medium tracking-wide mb-2" style={{ color: accent }}>LumenOrbit</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">Files in quiet orbit.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Drop local files into a soft circular orbit. Shared caption, per-item notes, live previews, gentle glow. Soft size warnings only — never hard limits. Polished Discord embeds on every link. Human-crafted Apple-style spring animations on frosted glass.
          </p>

          <div
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-[#5AC8FA]/30'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('ring-2', 'ring-[#5AC8FA]/30')}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('ring-2', 'ring-[#5AC8FA]/30');
              if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-white/10 rounded-3xl p-16 text-center mb-7 cursor-pointer hover:border-[#5AC8FA]/30 transition bg-black/20"
          >
            <p className="text-neutral-300 text-[15px]">Drop files into orbit</p>
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
            placeholder="Optional shared orbit caption"
            rows={2}
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-[#5AC8FA]/40 transition resize-none"
          />

          <div className="flex items-center gap-3 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-500">Orbit accent</span>
          </div>

          {warn && <p className="text-[13px] text-amber-300/80 mb-5">{warn}</p>}

          <div className="relative h-48 mb-6 flex items-center justify-center">
            <AnimatePresence>
              {items.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ type: 'spring', stiffness: 180, damping: 20, delay: idx * 0.05 }}
                  className="absolute w-16 h-16 rounded-2xl overflow-hidden border border-white/10 shadow-lg"
                  style={{
                    transform: `rotate(${item.angle}deg) translateY(-70px) rotate(-${item.angle}deg)`,
                    background: item.preview ? 'transparent' : 'rgba(255,255,255,0.05)',
                  }}
                >
                  {item.preview ? (
                    <img src={item.preview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-[10px] text-neutral-500">file</div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            <div className="w-12 h-12 rounded-full border border-white/10 bg-black/30" />
          </div>

          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.id + '-row'}
                layout
                initial={{ opacity: 0, y: 14, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 210, damping: 23 }}
                className="glass rounded-2xl p-4 flex flex-col gap-3 mb-3 border border-white/5"
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
                      <button onClick={() => navigate('share', item.link!.split('/').pop() || '')} className="text-xs text-cyan-400 truncate block mt-0.5 text-left">{item.link}</button>
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
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl mt-2"
            style={{ background: accent }}
          >
            {busy ? 'Settling orbit…' : items.length ? `Orbit ${items.length} file${items.length === 1 ? '' : 's'}` : 'Drop a file first'}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
