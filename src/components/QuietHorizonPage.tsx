import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

type Item = {
  file: File;
  preview?: string;
  id: string;
  status: 'queued' | 'uploading' | 'done' | 'error';
  link?: string;
  error?: string;
};

export default function QuietHorizonPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [recent, setRecent] = useState<CloudMeta[]>([]);
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#AF52DE');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listPublicShares(12).then(setRecent).catch(() => setRecent([]));
  }, []);

  const addFiles = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    const total = arr.reduce((s, f) => s + f.size, 0);
    setWarn(total > 45_000_000 ? 'Large batch — uploads may feel slower. No hard limits.' : null);
    const next: Item[] = arr.map((file) => ({
      file,
      id: Math.random().toString(36).slice(2, 10),
      status: 'queued',
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
        const res = await publishLocalFile(item.file, {
          caption: caption.trim() || item.file.name,
          color: accent,
          cardTitle: item.file.name,
          meta: { desk: 'quiethorizon' },
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
    listPublicShares(12).then(setRecent).catch(() => {});
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 22 }}
          className="glass rounded-[36px] p-8 md:p-10 mb-8"
        >
          <p className="text-[13px] font-medium tracking-wide mb-2" style={{ color: accent }}>Quiet Horizon</p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3">The far edge of recent shares.</h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed mb-8">
            Drop local files onto a quiet horizon of frosted glass. Watch recent public shares drift by. Shared caption and accent. Publishes to the database with polished Discord embeds on every link. Soft size warnings only. No hard limits. Apple-style springs.
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
            className="border-2 border-dashed border-white/12 rounded-3xl p-12 text-center mb-6 cursor-pointer hover:border-white/25 transition bg-black/20"
          >
            <p className="text-neutral-300 text-[15px]">Drop files here</p>
            <p className="text-neutral-500 text-sm mt-1">or click to choose</p>
            <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => e.target.files && addFiles(e.target.files)} />
          </div>

          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional caption"
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-4 focus:outline-none focus:border-white/30"
          />

          <div className="flex items-center gap-3 mb-5">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-500">Accent</span>
          </div>

          {warn && <p className="text-[13px] text-amber-300/80 mb-4">{warn}</p>}

          <AnimatePresence>
            {items.map((item) => (
              <motion.div key={item.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass rounded-2xl p-3 flex items-center gap-3 mb-2">
                {item.preview ? <img src={item.preview} alt="" className="w-12 h-12 rounded-xl object-cover" /> : <div className="w-12 h-12 rounded-xl bg-white/5 grid place-items-center text-[11px] text-neutral-500">file</div>}
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{item.file.name}</p>
                  <p className="text-xs text-neutral-500">{item.status}{item.link ? ' · ' : ''}{item.link && <a href={item.link} className="text-blue-400">{item.link.split('/').pop()}</a>}</p>
                  {item.error && <p className="text-xs text-red-400">{item.error}</p>}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={publish}
            disabled={busy || !items.length}
            className="w-full rounded-2xl py-3.5 text-[15px] font-medium text-white disabled:opacity-40 mt-2"
            style={{ background: accent }}
          >
            {busy ? 'Publishing…' : items.length ? `Publish ${items.length}` : 'Drop a file first'}
          </motion.button>
        </motion.div>

        <div>
          <h2 className="text-sm font-medium text-neutral-400 mb-4 px-1">recent on the horizon</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {recent.map((s) => (
              <motion.a
                key={s.id}
                href={`/s/${s.id}`}
                target="_blank"
                rel="noreferrer"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-4 hover:bg-white/5 transition block"
              >
                <p className="text-sm font-medium truncate">{s.name}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{s.caption || 'shared'} · {(s.size / 1024 / 1024).toFixed(1)} MB</p>
              </motion.a>
            ))}
            {!recent.length && <p className="text-neutral-500 text-sm">nothing recent yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
