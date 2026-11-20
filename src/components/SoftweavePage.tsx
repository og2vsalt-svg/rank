import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

type WeaveItem = {
  file?: File;
  note: string;
  id: string;
  status: 'queued' | 'uploading' | 'done' | 'error';
  link?: string;
  error?: string;
};

export default function SoftweavePage() {
  const [items, setItems] = useState<WeaveItem[]>([]);
  const [layer, setLayer] = useState('');
  const [accent, setAccent] = useState('#AF52DE');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addNote = () => {
    setItems((p) => [
      ...p,
      { note: '', id: Math.random().toString(36).slice(2, 10), status: 'queued' },
    ]);
  };

  const addFiles = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    const total = arr.reduce((s, f) => s + f.size, 0);
    setWarn(total > 48_000_000 ? 'Large weave — may feel slower. No hard limits.' : null);
    const next: WeaveItem[] = arr.map((file) => ({
      file,
      note: '',
      id: Math.random().toString(36).slice(2, 10),
      status: 'queued',
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
        if (item.file) {
          const caption = [layer.trim(), item.note.trim()].filter(Boolean).join(' \u2014 ') || item.file.name;
          const res = await publishLocalFile(item.file, {
            caption,
            color: accent,
            cardTitle: item.file.name,
            meta: { desk: 'softweave', layer: layer.trim() || null },
          });
          setItems((p) => p.map((i) =>
            i.id === item.id
              ? { ...i, status: res.ok ? 'done' : 'error', link: res.embed, error: res.error }
              : i
          ));
        } else {
          // pure note as text file
          const blob = new Blob([item.note || layer || 'soft note'], { type: 'text/plain' });
          const file = new File([blob], 'soft-note.txt', { type: 'text/plain' });
          const res = await publishLocalFile(file, {
            caption: item.note || layer || 'soft note',
            color: accent,
            cardTitle: 'soft note',
            meta: { desk: 'softweave', layer: layer.trim() || null },
          });
          setItems((p) => p.map((i) =>
            i.id === item.id
              ? { ...i, status: res.ok ? 'done' : 'error', link: res.embed, error: res.error }
              : i
          ));
        }
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
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 95, damping: 18 }}
          className="glass rounded-[36px] p-8 md:p-12"
        >
          <p className="text-[13px] font-medium tracking-wide mb-2" style={{ color: accent }}>Softweave</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">Layer quiet notes.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            A soft surface for notes that can carry files or stand alone. Add a layer that weaves through them. Each becomes a share in the database with a polished Discord embed. Soft size warnings only. Human-crafted spring motion on frosted glass.
          </p>

          <input
            value={layer}
            onChange={(e) => setLayer(e.target.value)}
            placeholder="Optional weaving layer"
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition"
          />

          <div className="flex items-center gap-3 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-500">Accent for embeds</span>
          </div>

          <div className="flex gap-3 mb-6">
            <button
              onClick={addNote}
              className="px-5 py-2.5 rounded-full bg-white/10 text-sm hover:bg-white/15 transition"
            >
              add note
            </button>
            <button
              onClick={() => inputRef.current?.click()}
              className="px-5 py-2.5 rounded-full bg-white/10 text-sm hover:bg-white/15 transition"
            >
              add files
            </button>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
          </div>

          {warn && <p className="text-[13px] text-amber-300/80 mb-5">{warn}</p>}

          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 160, damping: 20 }}
                className="glass rounded-2xl p-4 mb-3"
              >
                {item.file && (
                  <p className="text-xs text-neutral-500 mb-2 truncate">{item.file.name} · {(item.file.size / 1024 / 1024).toFixed(1)} MB</p>
                )}
                <textarea
                  value={item.note}
                  onChange={(e) => setItems((p) => p.map((i) => i.id === item.id ? { ...i, note: e.target.value } : i))}
                  placeholder={item.file ? 'note for this file' : 'quiet note'}
                  rows={2}
                  className="w-full bg-black/20 border border-white/8 rounded-xl px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/25 resize-none"
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-neutral-500">{item.status}</span>
                  <button
                    onClick={() => setItems((p) => p.filter((i) => i.id !== item.id))}
                    className="text-xs text-neutral-500 hover:text-white"
                  >
                    remove
                  </button>
                </div>
                {item.link && (
                  <a href={item.link} target="_blank" rel="noreferrer" className="text-xs text-blue-400 truncate block mt-1">{item.link}</a>
                )}
                {item.error && <p className="text-xs text-red-400 mt-1">{item.error}</p>}
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
            {busy ? 'Weaving…' : items.length ? `Weave ${items.length}` : 'Add something first'}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
