import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from './Router';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

function formatBytes(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(2) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

type Pending = { file: File; note: string };

export default function QuietSolacePage() {
  const { navigate } = useRouter();
  const [pending, setPending] = useState<Pending[]>([]);
  const [sharedCaption, setSharedCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<{ id: string; name: string; embed: string; warn?: string | null }[]>([]);
  const [recent, setRecent] = useState<CloudMeta[]>([]);
  const [drag, setDrag] = useState(false);

  const loadRecent = useCallback(async () => {
    const list = await listPublicShares(10);
    setRecent(list);
  }, []);

  useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  const addFiles = (list: File[]) => {
    if (!list.length) return;
    setPending((prev) =>
      [...prev, ...list.map((file) => ({ file, note: '' }))].slice(0, 16),
    );
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const updateNote = (i: number, note: string) => {
    setPending((prev) => prev.map((p, idx) => (idx === i ? { ...p, note } : p)));
  };

  const remove = (i: number) => {
    setPending((prev) => prev.filter((_, idx) => idx !== i));
  };

  const publish = async () => {
    if (!pending.length || busy) return;
    setBusy(true);
    const next: typeof results = [];
    for (const item of pending) {
      const warn = item.file.size > 40 * 1024 * 1024 ? 'large drop — may feel slow to settle' : null;
      const caption = item.note.trim() || sharedCaption.trim() || undefined;
      const res = await publishLocalFile(item.file, { caption, color: '#5AC8FA' });
      if (res.ok && res.id && res.embed) {
        next.push({ id: res.id, name: item.file.name, embed: res.embed, warn: res.warn || warn });
      }
    }
    setResults(next);
    setPending([]);
    setSharedCaption('');
    setBusy(false);
    loadRecent();
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 22 }}
          className="text-center mb-12"
        >
          <p className="text-[#5AC8FA] text-sm font-medium tracking-wide mb-3">quiet solace</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-4">calm file hosting</h1>
          <p className="text-neutral-400 text-lg max-w-xl mx-auto">
            Drop local files. Each can carry its own quiet note, or share one caption across them. They settle as soft frosted glass with gentle spring motion. Batch-publish to the database with polished Discord embeds. Soft size warnings only. No hard limits.
          </p>
        </motion.div>

        <motion.div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          animate={{ scale: drag ? 1.008 : 1, borderColor: drag ? '#5AC8FA' : 'rgba(255,255,255,0.08)' }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          className="glass rounded-3xl p-8 mb-8 border-2 border-dashed"
        >
          <div className="text-center py-8">
            <p className="text-neutral-300 mb-2">drop files here</p>
            <p className="text-xs text-neutral-500">large files warned, never refused · human-crafted pacing</p>
            <input
              type="file"
              multiple
              className="hidden"
              id="solace-input"
              onChange={(e) => addFiles(Array.from(e.target.files || []))}
            />
            <label htmlFor="solace-input" className="mt-4 inline-block px-5 py-2 rounded-full bg-white/10 text-sm cursor-pointer hover:bg-white/15 transition">
              choose files
            </label>
          </div>

          <AnimatePresence>
            {pending.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-6 space-y-3">
                {pending.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 rounded-2xl p-4"
                  >
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="truncate max-w-[70%]">{item.file.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-neutral-500 text-xs">{formatBytes(item.file.size)}</span>
                        <button onClick={() => remove(i)} className="text-xs text-neutral-500 hover:text-white">remove</button>
                      </div>
                    </div>
                    <input
                      value={item.note}
                      onChange={(e) => updateNote(i, e.target.value)}
                      placeholder="optional quiet note for this file"
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs outline-none focus:border-[#5AC8FA]/40"
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6">
            <input
              value={sharedCaption}
              onChange={(e) => setSharedCaption(e.target.value)}
              placeholder="optional shared caption (used when a file has no note)"
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#5AC8FA]/40"
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={!pending.length || busy}
            onClick={publish}
            className="mt-4 w-full py-3 rounded-2xl bg-white text-black text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {busy ? 'settling…' : `publish ${pending.length || ''} file${pending.length === 1 ? '' : 's'}`}
          </motion.button>
        </motion.div>

        {results.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6 mb-10">
            <p className="text-sm text-[#5AC8FA] mb-4">solace links</p>
            {results.map((r) => (
              <div key={r.id} className="mb-3 last:mb-0">
                <p className="text-sm truncate">{r.name}</p>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => navigator.clipboard.writeText(r.embed)}
                    className="text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15"
                  >
                    copy discord link
                  </button>
                  <button onClick={() => navigate('share', r.id)} className="text-xs px-3 py-1.5 rounded-full bg-white/5">
                    open
                  </button>
                </div>
                {r.warn && <p className="text-xs text-amber-400/80 mt-1">{r.warn}</p>}
              </div>
            ))}
          </motion.div>
        )}

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold tracking-tight">recent public shares</h2>
            <button onClick={loadRecent} className="text-xs text-neutral-500 hover:text-neutral-300">refresh</button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {recent.map((item) => (
              <motion.button
                key={item.id}
                whileHover={{ y: -2 }}
                onClick={() => navigate('share', item.id)}
                className="glass rounded-2xl p-4 text-left"
              >
                <p className="text-sm font-medium truncate">{item.name}</p>
                <p className="text-xs text-neutral-500 mt-1">{formatBytes(item.size)} · {item.caption || 'no caption'}</p>
              </motion.button>
            ))}
            {!recent.length && <p className="text-sm text-neutral-500 col-span-full">nothing public yet. drop a file above.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
