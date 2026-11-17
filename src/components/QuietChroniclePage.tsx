import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

type Entry = {
  file: File;
  preview?: string;
  id: string;
  date: string;
  note: string;
  status: 'queued' | 'uploading' | 'done' | 'error';
  link?: string;
  error?: string;
};

export default function QuietChroniclePage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [sharedCaption, setSharedCaption] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    const total = arr.reduce((s, f) => s + f.size, 0);
    setWarn(total > 45_000_000 ? 'Large batch — uploads may feel slower. No hard limits.' : null);
    const today = new Date().toISOString().slice(0, 10);
    const next: Entry[] = arr.map((file) => ({
      file,
      id: Math.random().toString(36).slice(2, 10),
      date: today,
      note: '',
      status: 'queued',
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));
    setEntries((p) => [...p, ...next]);
  }, []);

  const publish = async () => {
    if (!entries.length || busy) return;
    setBusy(true);
    for (const entry of entries) {
      if (entry.status === 'done') continue;
      setEntries((p) => p.map((i) => i.id === entry.id ? { ...i, status: 'uploading' } : i));
      try {
        const caption = [sharedCaption, entry.note].filter(Boolean).join(' · ') || entry.file.name;
        const res = await publishLocalFile(entry.file, {
          caption,
          color: accent,
          cardTitle: `${entry.date} — ${entry.file.name}`,
          meta: { desk: 'quietchronicle', date: entry.date, note: entry.note },
        });
        setEntries((p) => p.map((i) =>
          i.id === entry.id
            ? { ...i, status: res.ok ? 'done' : 'error', link: res.embed, error: res.error }
            : i
        ));
      } catch (e: any) {
        setEntries((p) => p.map((i) => i.id === entry.id ? { ...i, status: 'error', error: e.message } : i));
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
          <p className="text-[13px] font-medium tracking-wide mb-2" style={{ color: accent }}>Quiet Chronicle</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">Place files in time.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Drop local files into a quiet chronological journal. Stamp each with a date and a short note. They settle into the database as dated entries. Every share link carries a polished Discord embed. Soft size warnings only — never hard limits. Apple-style spring motion on frosted glass.
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
            value={sharedCaption}
            onChange={(e) => setSharedCaption(e.target.value)}
            placeholder="Optional shared caption"
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition"
          />

          <div className="flex items-center gap-3 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-500">Accent for the embeds</span>
          </div>

          {warn && <p className="text-[13px] text-amber-300/80 mb-5">{warn}</p>}

          <AnimatePresence>
            {entries.map((entry) => (
              <motion.div
                key={entry.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="glass rounded-2xl p-4 mb-3"
              >
                <div className="flex items-center gap-4 mb-3">
                  {entry.preview ? (
                    <img src={entry.preview} alt="" className="w-14 h-14 rounded-xl object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-white/5 grid place-items-center text-[11px] text-neutral-500">file</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{entry.file.name}</p>
                    <p className="text-xs text-neutral-500">{(entry.file.size / 1024 / 1024).toFixed(1)} MB · {entry.status}</p>
                  </div>
                  <button
                    onClick={() => setEntries((p) => p.filter((i) => i.id !== entry.id))}
                    className="text-xs text-neutral-500 hover:text-white px-2"
                  >
                    remove
                  </button>
                </div>
                <div className="flex gap-3">
                  <input
                    type="date"
                    value={entry.date}
                    onChange={(e) => setEntries((p) => p.map((i) => i.id === entry.id ? { ...i, date: e.target.value } : i))}
                    className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
                  />
                  <input
                    value={entry.note}
                    onChange={(e) => setEntries((p) => p.map((i) => i.id === entry.id ? { ...i, note: e.target.value } : i))}
                    placeholder="Quiet note for this moment"
                    className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30"
                  />
                </div>
                {entry.link && (
                  <a href={entry.link} target="_blank" rel="noreferrer" className="text-xs text-blue-400 truncate block mt-2">{entry.link}</a>
                )}
                {entry.error && <p className="text-xs text-red-400 mt-1">{entry.error}</p>}
              </motion.div>
            ))}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || !entries.length}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl mt-2"
            style={{ background: accent }}
          >
            {busy ? 'Publishing…' : entries.length ? `Publish ${entries.length} entry${entries.length === 1 ? '' : 's'}` : 'Drop a file first'}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
