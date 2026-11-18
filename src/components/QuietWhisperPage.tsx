import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

type Item = {
  file?: File;
  note: string;
  id: string;
  status: 'queued' | 'uploading' | 'done' | 'error';
  link?: string;
  error?: string;
};

export default function QuietWhisperPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#5AC8FA');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addNoteOrFile = useCallback((list?: FileList | File[]) => {
    const files = list ? Array.from(list) : [];
    const total = files.reduce((s, f) => s + f.size, 0);
    setWarn(total > 45_000_000 ? 'Large batch — uploads may feel slower. No hard limits.' : null);
    const base: Item = {
      note: note.trim() || 'a quiet whisper',
      id: Math.random().toString(36).slice(2, 10),
      status: 'queued',
    };
    if (files.length) {
      const next = files.map((file) => ({ ...base, file, id: Math.random().toString(36).slice(2, 10) }));
      setItems((p) => [...p, ...next]);
    } else if (note.trim()) {
      setItems((p) => [...p, base]);
    }
    setNote('');
  }, [note]);

  const publish = async () => {
    if (!items.length || busy) return;
    setBusy(true);
    for (const item of items) {
      if (item.status === 'done') continue;
      setItems((p) => p.map((i) => i.id === item.id ? { ...i, status: 'uploading' } : i));
      try {
        let res;
        if (item.file) {
          res = await publishLocalFile(item.file, {
            caption: item.note,
            color: accent,
            cardTitle: item.file.name,
            meta: { desk: 'quietwhisper' },
          });
        } else {
          // Note-only: create a tiny text file
          const blob = new Blob([item.note], { type: 'text/plain' });
          const file = new File([blob], 'whisper.txt', { type: 'text/plain' });
          res = await publishLocalFile(file, {
            caption: item.note,
            color: accent,
            cardTitle: 'Quiet Whisper',
            meta: { desk: 'quietwhisper', noteOnly: true },
          });
        }
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 22 }}
          className="glass rounded-[36px] p-8 md:p-12"
        >
          <p className="text-[13px] font-medium tracking-wide mb-2" style={{ color: accent }}>Quiet Whisper</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">A soft note.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Write a quiet note. Attach a local file if the words need company, or let the whisper alone become the share. They settle into the database with a polished Discord embed on every link. Soft size warnings only — never hard limits. Apple-style spring motion on frosted glass.
          </p>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="a quiet note..."
            rows={3}
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition resize-none"
          />

          <div
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-white/20'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('ring-2', 'ring-white/20')}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('ring-2', 'ring-white/20');
              if (e.dataTransfer.files.length) addNoteOrFile(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-white/12 rounded-3xl p-10 text-center mb-7 cursor-pointer hover:border-white/25 transition bg-black/20"
          >
            <p className="text-neutral-300 text-[15px]">Optional file</p>
            <p className="text-neutral-500 text-sm mt-1">drop or click</p>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && addNoteOrFile(e.target.files)}
            />
          </div>

          <div className="flex items-center gap-3 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-500">Accent for the embed</span>
          </div>

          {warn && <p className="text-[13px] text-amber-300/80 mb-5">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => addNoteOrFile()}
            disabled={!note.trim()}
            className="w-full rounded-2xl py-3 text-[14px] font-medium text-white/80 border border-white/10 hover:bg-white/5 mb-4 disabled:opacity-40 transition"
          >
            Add note only
          </motion.button>

          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="glass rounded-2xl p-4 flex items-center gap-4 mb-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.file ? item.file.name : 'whisper.txt'}</p>
                  <p className="text-xs text-neutral-500 line-clamp-2">{item.note}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{item.status}</p>
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

          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || !items.length}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl mt-2"
            style={{ background: accent }}
          >
            {busy ? 'Publishing…' : items.length ? `Publish ${items.length} whisper${items.length === 1 ? '' : 's'}` : 'Add a note or file first'}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
