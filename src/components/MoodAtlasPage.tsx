import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

type AtlasItem = {
  file?: File;
  note: string;
  color: string;
  id: string;
  preview?: string;
  status: 'idle' | 'uploading' | 'done' | 'error';
  link?: string;
};

export default function MoodAtlasPage() {
  const { navigate } = useRouter();
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [items, setItems] = useState<AtlasItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addNote = () => {
    setItems((p) => [
      ...p,
      { id: Math.random().toString(36).slice(2, 10), note: '', color: accent, status: 'idle' },
    ]);
  };

  const addFiles = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    const total = arr.reduce((s, f) => s + f.size, 0);
    setWarn(total > 80_000_000 ? 'Large files may take a moment. No hard limits.' : null);
    const next: AtlasItem[] = arr.map((file) => ({
      file,
      id: Math.random().toString(36).slice(2, 10),
      note: '',
      color: accent,
      status: 'idle',
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));
    setItems((p) => [...p, ...next]);
  }, [accent]);

  const publish = async () => {
    if (busy) return;
    setBusy(true);
    const boardCaption = [title.trim(), caption.trim()].filter(Boolean).join(' — ') || 'mood atlas';
    for (const item of items) {
      if (item.status === 'done') continue;
      setItems((p) => p.map((i) => i.id === item.id ? { ...i, status: 'uploading' } : i));
      try {
        if (item.file) {
          const res = await publishLocalFile(item.file, {
            caption: [boardCaption, item.note.trim()].filter(Boolean).join(' · '),
            color: item.color || accent,
            cardTitle: title || item.file.name,
            meta: { desk: 'moodatlas', note: item.note },
          });
          const link = res.ok && res.id ? shareUrls(res.id).app : undefined;
          setItems((p) => p.map((i) =>
            i.id === item.id ? { ...i, status: res.ok ? 'done' : 'error', link } : i
          ));
        } else {
          // pure note — still create a lightweight share via a tiny text file if needed, or skip for now
          setItems((p) => p.map((i) => i.id === item.id ? { ...i, status: 'done', link: undefined } : i));
        }
      } catch {
        setItems((p) => p.map((i) => i.id === item.id ? { ...i, status: 'error' } : i));
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
          transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          className="glass rounded-[36px] p-8 md:p-12 border border-white/5"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#0A84FF] mb-2">Mood Atlas</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">Map a mood.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Gather notes, colors, and local files into one quiet atlas. Each piece becomes a polished Discord-ready share. Soft size warnings only.
          </p>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Atlas title"
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-4 focus:outline-none focus:border-white/30 transition"
          />
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Quiet caption for the whole atlas"
            rows={2}
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-4 focus:outline-none focus:border-white/30 transition resize-none"
          />
          <div className="flex items-center gap-3 mb-6">
            <label className="text-sm text-neutral-400">Accent</label>
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full border border-white/10 bg-transparent cursor-pointer" />
          </div>

          <div className="flex gap-3 mb-6">
            <button onClick={addNote} className="px-5 py-2.5 rounded-full bg-white/10 text-sm text-white hover:bg-white/15 transition">add note</button>
            <button onClick={() => inputRef.current?.click()} className="px-5 py-2.5 rounded-full bg-white/10 text-sm text-white hover:bg-white/15 transition">add files</button>
            <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => e.target.files && addFiles(e.target.files)} />
          </div>

          {warn && <p className="text-[13px] text-amber-300/80 mb-5">{warn}</p>}

          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 240, damping: 26 }}
                className="glass rounded-2xl p-4 flex flex-col gap-3 mb-3 border border-white/5"
              >
                <div className="flex items-start gap-4">
                  {item.preview ? (
                    <img src={item.preview} alt="" className="w-14 h-14 rounded-xl object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl grid place-items-center text-[11px] text-neutral-500" style={{ background: item.color + '22' }}>note</div>
                  )}
                  <div className="flex-1">
                    <textarea
                      value={item.note}
                      onChange={(e) => setItems((p) => p.map((i) => i.id === item.id ? { ...i, note: e.target.value } : i))}
                      placeholder={item.file ? 'Note for this file' : 'A quiet note'}
                      rows={2}
                      className="w-full bg-black/20 border border-white/5 rounded-xl px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/20 resize-none"
                    />
                    <div className="flex items-center gap-2 mt-2">
                      <input type="color" value={item.color} onChange={(e) => setItems((p) => p.map((i) => i.id === item.id ? { ...i, color: e.target.value } : i))} className="w-7 h-7 rounded-full border border-white/10" />
                      <span className="text-xs text-neutral-500">{item.status}</span>
                      {item.link && (
                        <button onClick={() => navigate('share', item.link!.split('/').pop() || '')} className="text-xs text-[#0A84FF] truncate">{item.link}</button>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setItems((p) => p.filter((i) => i.id !== item.id))} className="text-xs text-neutral-500 hover:text-white">remove</button>
                </div>
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
            {busy ? 'Mapping…' : items.length ? `Publish atlas (${items.length})` : 'Add something first'}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
