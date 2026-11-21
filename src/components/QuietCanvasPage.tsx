import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

type Tile = {
  file: File;
  preview?: string;
  id: string;
  note: string;
  status: 'queued' | 'uploading' | 'done' | 'error';
  link?: string;
  error?: string;
};

export default function QuietCanvasPage() {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [title, setTitle] = useState('');
  const [accent, setAccent] = useState('#5AC8FA');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    const total = arr.reduce((s, f) => s + f.size, 0);
    setWarn(total > 45_000_000 ? 'Large batch — uploads may feel slower. No hard limits.' : null);
    const next: Tile[] = arr.map((file) => ({
      file,
      id: Math.random().toString(36).slice(2, 10),
      note: '',
      status: 'queued',
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));
    setTiles((p) => [...p, ...next]);
  }, []);

  const publish = async () => {
    if (!tiles.length || busy) return;
    setBusy(true);
    for (const tile of tiles) {
      if (tile.status === 'done') continue;
      setTiles((p) => p.map((t) => t.id === tile.id ? { ...t, status: 'uploading' } : t));
      try {
        const res = await publishLocalFile(tile.file, {
          caption: tile.note.trim() || title.trim() || tile.file.name,
          color: accent,
          cardTitle: title.trim() || tile.file.name,
          meta: { desk: 'quietcanvas', note: tile.note },
        });
        setTiles((p) => p.map((t) =>
          t.id === tile.id
            ? { ...t, status: res.ok ? 'done' : 'error', link: res.embed, error: res.error }
            : t
        ));
      } catch (e: any) {
        setTiles((p) => p.map((t) => t.id === tile.id ? { ...t, status: 'error', error: e.message } : t));
      }
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 22 }}
          className="glass rounded-[36px] p-8 md:p-12"
        >
          <p className="text-[13px] font-medium tracking-wide mb-2" style={{ color: accent }}>Quiet Canvas</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">Arrange quietly.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Drop files onto a calm surface. Each tile can hold a short note. Everything publishes with a polished Discord embed. Soft size warnings only. Spring animations on frosted glass.
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
            <p className="text-neutral-300 text-[15px]">Drop files onto the canvas</p>
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
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Shared title (optional)"
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition"
          />

          <div className="flex items-center gap-3 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-500">Accent for embeds</span>
          </div>

          {warn && <p className="text-[13px] text-amber-300/80 mb-5">{warn}</p>}

          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <AnimatePresence>
              {tiles.map((tile) => (
                <motion.div
                  key={tile.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                  className="glass rounded-2xl p-4"
                >
                  {tile.preview ? (
                    <img src={tile.preview} alt="" className="w-full h-32 rounded-xl object-cover mb-3" />
                  ) : (
                    <div className="w-full h-32 rounded-xl bg-white/5 grid place-items-center text-[11px] text-neutral-500 mb-3">file</div>
                  )}
                  <p className="text-sm font-medium truncate mb-1">{tile.file.name}</p>
                  <p className="text-xs text-neutral-500 mb-2">{(tile.file.size / 1024 / 1024).toFixed(1)} MB · {tile.status}</p>
                  <input
                    value={tile.note}
                    onChange={(e) => setTiles((p) => p.map((t) => t.id === tile.id ? { ...t, note: e.target.value } : t))}
                    placeholder="Tile note"
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-neutral-500 mb-2 focus:outline-none"
                  />
                  {tile.link && (
                    <a href={tile.link} target="_blank" rel="noreferrer" className="text-xs text-blue-400 truncate block">{tile.link}</a>
                  )}
                  {tile.error && <p className="text-xs text-red-400">{tile.error}</p>}
                  <button
                    onClick={() => setTiles((p) => p.filter((t) => t.id !== tile.id))}
                    className="text-xs text-neutral-500 hover:text-white mt-2"
                  >
                    remove
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || !tiles.length}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl"
            style={{ background: accent }}
          >
            {busy ? 'Publishing…' : tiles.length ? `Publish ${tiles.length} tile${tiles.length === 1 ? '' : 's'}` : 'Drop a file first'}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
