import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

type LumenItem = {
  file: File;
  id: string;
  preview?: string;
  status: 'queued' | 'glowing' | 'done' | 'error';
  link?: string;
  error?: string;
};

export default function QuietLumenPage() {
  const [items, setItems] = useState<LumenItem[]>([]);
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#FF9F0A');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);

  const onFiles = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    const total = arr.reduce((s, f) => s + f.size, 0);
    setWarn(total > 48_000_000 ? 'Warm batch. The glow may take a moment. No hard limits.' : null);
    const next: LumenItem[] = arr.map(file => ({
      file,
      id: Math.random().toString(36).slice(2, 10),
      status: 'queued',
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));
    setItems(prev => [...prev, ...next]);
  }, []);

  const publish = async () => {
    if (!items.length) return;
    setBusy(true);
    for (const item of items) {
      if (item.status === 'done') continue;
      setItems(prev => prev.map(it => it.id === item.id ? { ...it, status: 'glowing' } : it));
      try {
        const res = await publishLocalFile(item.file, {
          caption: caption.trim() || item.file.name,
          color: accent,
          cardTitle: item.file.name,
          meta: { desk: 'quietlumen', glow: true },
        });
        setItems(prev => prev.map(it =>
          it.id === item.id
            ? { ...it, status: res.ok ? 'done' : 'error', link: res.embed, error: res.error }
            : it
        ));
      } catch (e: any) {
        setItems(prev => prev.map(it => it.id === item.id ? { ...it, status: 'error', error: e.message } : it));
      }
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[32px] p-8 md:p-12 shadow-2xl"
        >
          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>Quiet Lumen</p>
          <h1 className="text-[40px] font-semibold tracking-tight mb-3">Let them glow.</h1>
          <p className="text-neutral-400 text-[16px] leading-relaxed mb-8 max-w-2xl">
            Drop local files. They settle as soft glowing orbs of frosted glass with gentle spring light. Shared caption, warm accent. Batch-publish to the database. Every link unfurls a polished Discord embed. Soft size warnings only. No hard limits. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting.
          </p>

          <div
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-orange-400/30'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('ring-2', 'ring-orange-400/30')}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('ring-2', 'ring-orange-400/30');
              if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
            }}
            className="border-2 border-dashed border-white/15 rounded-3xl p-12 text-center mb-8 transition hover:border-white/25 bg-black/10"
          >
            <p className="text-neutral-300 mb-4">Drop files here or</p>
            <label className="inline-block px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/15 cursor-pointer text-sm font-medium transition">
              choose files
              <input type="file" multiple className="hidden" onChange={(e) => e.target.files && onFiles(e.target.files)} />
            </label>
          </div>

          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Shared caption (optional)"
            className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-4 focus:outline-none focus:border-white/25 transition"
          />

          <div className="flex items-center gap-4 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0 bg-transparent" />
            <span className="text-[13px] text-neutral-400">Warm accent for embeds</span>
          </div>

          {warn && <p className="text-[13px] text-amber-300/90 mb-6">{warn}</p>}

          <AnimatePresence>
            {items.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 mb-8">
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.94 }}
                    className="glass rounded-2xl p-4 flex items-center gap-4"
                  >
                    {item.preview ? (
                      <img src={item.preview} alt="" className="w-16 h-16 rounded-xl object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-white/5 grid place-items-center text-xs text-neutral-500">file</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.file.name}</p>
                      <p className="text-xs text-neutral-500">{item.status}</p>
                      {item.link && <a href={item.link} target="_blank" rel="noreferrer" className="text-xs text-blue-400 truncate block">{item.link}</a>}
                      {item.error && <p className="text-xs text-red-400">{item.error}</p>}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.01 }}
            onClick={publish}
            disabled={busy || !items.length}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-black disabled:opacity-40 transition shadow-lg"
            style={{ background: accent }}
          >
            {busy ? 'Glowing…' : `Glow ${items.length || ''} file${items.length === 1 ? '' : 's'}`}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
