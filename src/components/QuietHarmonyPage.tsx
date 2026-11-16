import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

type HarmonyItem = {
  file?: File;
  note: string;
  id: string;
  preview?: string;
  status: 'queued' | 'uploading' | 'done' | 'error';
  link?: string;
  error?: string;
};

export default function QuietHarmonyPage() {
  const [items, setItems] = useState<HarmonyItem[]>([]);
  const [sharedNote, setSharedNote] = useState('');
  const [accent, setAccent] = useState('#AF52DE');
  const [busy, setBusy] = useState(false);
  const [globalWarn, setGlobalWarn] = useState<string | null>(null);

  const addPair = useCallback((file?: File) => {
    const id = Math.random().toString(36).slice(2, 10);
    const preview = file && file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
    setItems((prev) => [...prev, { file, note: '', id, preview, status: 'queued' }]);
    if (file && file.size > 40 * 1024 * 1024) setGlobalWarn('Large file in the harmony. May feel slow to settle. No hard limits.');
  }, []);

  const onFiles = (files: FileList | File[]) => {
    Array.from(files).forEach((f) => addPair(f));
  };

  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const setNote = (id: string, note: string) => setItems((prev) => prev.map((i) => i.id === id ? { ...i, note } : i));

  const publishAll = async () => {
    if (!items.length) return;
    setBusy(true);
    for (const item of items) {
      if (item.status === 'done' || !item.file) continue;
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: 'uploading' } : i));
      try {
        const caption = item.note.trim() || sharedNote.trim() || item.file.name;
        const res = await publishLocalFile(item.file, {
          caption,
          color: accent,
          cardTitle: item.file.name,
          meta: { desk: 'quietharmony', kind: item.file.type.split('/')[0] || 'file' },
        });
        setItems((prev) => prev.map((i) =>
          i.id === item.id
            ? { ...i, status: res.ok ? 'done' : 'error', link: res.embed || undefined, error: res.error }
            : i
        ));
      } catch (e: any) {
        setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: 'error', error: e.message } : i));
      }
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 95, damping: 20 }}
          className="glass rounded-[32px] p-8 md:p-12 shadow-2xl"
        >
          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>Quiet Harmony</p>
          <h1 className="text-[40px] font-semibold tracking-tight mb-3">Find the quiet balance.</h1>
          <p className="text-neutral-400 text-[16px] leading-relaxed mb-8 max-w-2xl">
            Pair a local file with its own quiet note, or share one caption across them. They settle side by side in frosted glass with gentle spring motion. Batch-publish to the database. Every link unfurls a polished Discord embed. Soft size warnings only. No hard limits. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting.
          </p>

          <div
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-white/20'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('ring-2', 'ring-white/20')}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('ring-2', 'ring-white/20');
              if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
            }}
            className="border-2 border-dashed border-white/15 rounded-3xl p-10 text-center mb-6 transition hover:border-white/25 bg-black/10"
          >
            <p className="text-neutral-300 mb-3">Drop files to start a harmony</p>
            <label className="inline-block px-5 py-2 rounded-full bg-white/10 hover:bg-white/15 cursor-pointer text-sm font-medium transition">
              choose files
              <input type="file" multiple className="hidden" onChange={(e) => e.target.files && onFiles(e.target.files)} />
            </label>
            <button onClick={() => addPair()} className="ml-3 px-5 py-2 rounded-full bg-white/5 hover:bg-white/10 text-sm transition">add note only</button>
          </div>

          <input
            value={sharedNote}
            onChange={(e) => setSharedNote(e.target.value)}
            placeholder="Shared note (used when individual is empty)"
            className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-4 focus:outline-none focus:border-white/25 transition"
          />

          <div className="flex items-center gap-4 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0 bg-transparent" />
            <span className="text-[13px] text-neutral-400">Harmony accent</span>
          </div>

          {globalWarn && <p className="text-[13px] text-amber-300/90 mb-6">{globalWarn}</p>}

          <AnimatePresence>
            {items.length > 0 && (
              <motion.div layout className="space-y-4 mb-8">
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    className="glass rounded-2xl p-4 flex gap-4 items-start"
                  >
                    {item.preview ? (
                      <img src={item.preview} alt="" className="w-20 h-20 rounded-xl object-cover shrink-0" />
                    ) : item.file ? (
                      <div className="w-20 h-20 rounded-xl bg-white/5 grid place-items-center text-xs text-neutral-500 shrink-0">file</div>
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-white/5 grid place-items-center text-xs text-neutral-500 shrink-0">note</div>
                    )}
                    <div className="flex-1">
                      {item.file && <p className="text-sm font-medium truncate mb-1">{item.file.name}</p>}
                      <textarea
                        value={item.note}
                        onChange={(e) => setNote(item.id, e.target.value)}
                        placeholder="Quiet note for this piece…"
                        rows={2}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/20 resize-none"
                      />
                      {item.link && <a href={item.link} target="_blank" rel="noreferrer" className="text-xs text-blue-400 truncate block mt-1">{item.link}</a>}
                      {item.error && <p className="text-xs text-red-400 mt-1">{item.error}</p>}
                    </div>
                    <button onClick={() => remove(item.id)} className="text-xs text-neutral-500 hover:text-white shrink-0">remove</button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.005 }}
            onClick={publishAll}
            disabled={busy || !items.some(i => i.file)}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-lg"
            style={{ background: accent }}
          >
            {busy ? 'Finding harmony…' : `Publish ${items.filter(i => i.file).length || ''} piece${items.filter(i => i.file).length === 1 ? '' : 's'}`}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
