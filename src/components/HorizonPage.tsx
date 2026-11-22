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

export default function HorizonPage() {
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
    setWarn(total > 48_000_000 ? 'Large batch — may feel slower while rising. No hard limits.' : null);
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
        const caption = [sharedNote.trim(), item.note.trim()].filter(Boolean).join(' · ') || item.file.name;
        const res = await publishLocalFile(item.file, {
          caption,
          color: accent,
          cardTitle: item.file.name,
          meta: { desk: 'horizon', sharedNote: sharedNote.trim() || null },
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="relative mb-10"
        >
          <div className="absolute -top-8 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#5AC8FA]/40 to-transparent" />
          <h1 className="text-4xl font-semibold text-white tracking-tight mb-2">Horizon</h1>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Drop local files with a shared note and accent. They rise gently to the horizon line with spring motion. Lands in storage and public_shares. Every share link unfurls a polished Discord card. Large drops gently warned about possible slowness, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact.
          </p>
        </motion.div>

        <div
          onDragOver={(e) => { e.preventDefault(); }}
          onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          className="glass rounded-3xl border-2 border-dashed border-white/10 hover:border-[#5AC8FA]/30 transition-colors p-12 text-center cursor-pointer mb-6"
        >
          <p className="text-white/80 text-sm">Drop files or click to select</p>
          <p className="text-neutral-500 text-xs mt-1">Soft size warnings only</p>
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
          placeholder="Optional shared horizon caption"
          rows={2}
          className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-[#5AC8FA]/40 transition resize-none"
        />

        <div className="flex items-center gap-3 mb-6">
          <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0" />
          <span className="text-[13px] text-neutral-500">Horizon accent</span>
        </div>

        {warn && <p className="text-[13px] text-amber-300/80 mb-5">{warn}</p>}

        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 200, damping: 24 }}
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
                    <button onClick={() => navigate('share', item.link!.split('/').pop() || '')} className="text-xs text-blue-400 truncate block mt-0.5 text-left">{item.link}</button>
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
                className="w-full bg-black/20 border border-white/5 rounded-xl px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/20"
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {items.length > 0 && (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={publish}
            disabled={busy}
            className="w-full mt-6 py-3.5 rounded-full bg-[#5AC8FA] text-black text-sm font-medium hover:bg-[#7AD4FF] disabled:opacity-50 transition shadow-lg"
          >
            {busy ? 'rising…' : 'share to horizon'}
          </motion.button>
        )}
      </div>
    </div>
  );
}
