import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

type HarborItem = {
  file: File;
  note: string;
  preview?: string;
  id: string;
  status: 'queued' | 'uploading' | 'done' | 'error';
  link?: string;
  error?: string;
};

export default function MistHarborPage() {
  const [items, setItems] = useState<HarborItem[]>([]);
  const [mistNote, setMistNote] = useState('');
  const [accent, setAccent] = useState('#64D2FF');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [arrivals, setArrivals] = useState<CloudMeta[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listPublicShares(6).then(setArrivals).catch(() => {});
  }, []);

  const addFiles = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    const total = arr.reduce((s, f) => s + f.size, 0);
    setWarn(total > 50_000_000 ? 'Large mist — settling may feel slower. No hard limits.' : null);
    const next: HarborItem[] = arr.map((file) => ({
      file,
      note: '',
      id: Math.random().toString(36).slice(2, 10),
      status: 'queued',
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));
    setItems((p) => [...p, ...next]);
  }, []);

  const updateNote = (id: string, note: string) => {
    setItems((p) => p.map((i) => i.id === id ? { ...i, note } : i));
  };

  const publish = async () => {
    if (!items.length || busy) return;
    setBusy(true);
    for (const item of items) {
      if (item.status === 'done') continue;
      setItems((p) => p.map((i) => i.id === item.id ? { ...i, status: 'uploading' } : i));
      try {
        const caption = [mistNote.trim(), item.note.trim()].filter(Boolean).join(' · ') || item.file.name;
        const res = await publishLocalFile(item.file, {
          caption,
          color: accent,
          cardTitle: item.file.name,
          meta: { desk: 'mistharbor', note: item.note.trim() || null },
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
    listPublicShares(6).then(setArrivals).catch(() => {});
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 95, damping: 19 }}
          className="glass rounded-[38px] p-8 md:p-12 relative overflow-hidden"
        >
          <div className="absolute -bottom-20 right-0 w-72 h-72 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: accent }} />
          <p className="text-[13px] font-medium tracking-wide mb-2" style={{ color: accent }}>Mist Harbor</p>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-3">Files settle in soft mist.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8 max-w-xl">
            Drop local files into a misty harbor. Each can carry its own quiet note beside a shared mist line. They settle with Apple-style spring motion on frosted glass. Soft size warnings only — never hard limits. Every share link opens with a polished Discord embed.
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
            className="border-2 border-dashed border-white/12 rounded-[32px] p-16 text-center mb-7 cursor-pointer hover:border-white/25 transition bg-black/20"
          >
            <p className="text-neutral-300 text-[15px]">Drop files into the mist</p>
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
            value={mistNote}
            onChange={(e) => setMistNote(e.target.value)}
            placeholder="Shared mist note (optional)"
            rows={2}
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition resize-none"
          />

          <div className="flex items-center gap-3 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-500">Mist accent for embeds</span>
          </div>

          {warn && <p className="text-[13px] text-amber-300/80 mb-5">{warn}</p>}

          <AnimatePresence>
            {items.map((item, idx) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 115, damping: 17, delay: idx * 0.025 }}
                className="glass rounded-2xl p-4 flex flex-col sm:flex-row gap-4 mb-3"
              >
                {item.preview ? (
                  <img src={item.preview} alt="" className="w-full sm:w-16 h-16 rounded-xl object-cover" />
                ) : (
                  <div className="w-full sm:w-16 h-16 rounded-xl bg-white/5 grid place-items-center text-[11px] text-neutral-500">file</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.file.name}</p>
                  <p className="text-xs text-neutral-500 mb-2">{(item.file.size / 1024 / 1024).toFixed(1)} MB · {item.status}</p>
                  <input
                    value={item.note}
                    onChange={(e) => updateNote(item.id, e.target.value)}
                    placeholder="Quiet note for this arrival"
                    className="w-full bg-black/20 border border-white/8 rounded-xl px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/20"
                  />
                  {item.link && (
                    <a href={item.link} target="_blank" rel="noreferrer" className="text-xs text-blue-400 truncate block mt-1.5">{item.link}</a>
                  )}
                  {item.error && <p className="text-xs text-red-400 mt-1">{item.error}</p>}
                </div>
                <button
                  onClick={() => setItems((p) => p.filter((i) => i.id !== item.id))}
                  className="text-xs text-neutral-500 hover:text-white self-start sm:self-center"
                >
                  remove
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.004 }}
            onClick={publish}
            disabled={busy || !items.length}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-black disabled:opacity-40 transition shadow-xl mt-2"
            style={{ background: accent }}
          >
            {busy ? 'Settling into mist…' : items.length ? `Settle ${items.length} file${items.length === 1 ? '' : 's'}` : 'Drop a file first'}
          </motion.button>
        </motion.div>

        {arrivals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 85, damping: 18 }}
            className="mt-12"
          >
            <p className="text-[13px] text-neutral-500 mb-4 tracking-wide">Recent arrivals in the mist</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {arrivals.map((r) => (
                <a
                  key={r.id}
                  href={`/s/${r.id}`}
                  className="glass rounded-2xl p-3.5 block hover:bg-white/[0.06] transition"
                >
                  <p className="text-xs font-medium truncate">{r.name || 'shared'}</p>
                  <p className="text-[11px] text-neutral-500 mt-0.5">{((r.size || 0) / 1024 / 1024).toFixed(1)} MB</p>
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
