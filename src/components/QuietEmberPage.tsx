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

export default function QuietEmberPage() {
  const { navigate } = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<{ id: string; name: string; embed: string; warn?: string | null }[]>([]);
  const [recent, setRecent] = useState<CloudMeta[]>([]);
  const [drag, setDrag] = useState(false);

  const loadRecent = useCallback(async () => {
    const list = await listPublicShares(12);
    setRecent(list);
  }, []);

  useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length) setFiles((prev) => [...prev, ...dropped].slice(0, 16));
  };

  const publish = async () => {
    if (!files.length || busy) return;
    setBusy(true);
    const next: typeof results = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const warn = file.size > 25 * 1024 * 1024 ? 'large file — may feel slow to settle as an ember' : null;
      const note = notes[i] || caption || undefined;
      const res = await publishLocalFile(file, { caption: note, color: '#FF6B35' });
      if (res.ok && res.id && res.embed) {
        next.push({ id: res.id, name: file.name, embed: res.embed, warn: res.warn || warn });
      }
    }
    setResults(next);
    setFiles([]);
    setNotes({});
    setCaption('');
    setBusy(false);
    loadRecent();
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="text-center mb-12"
        >
          <p className="text-[#FF6B35] text-sm font-medium tracking-wide mb-3">quiet ember</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-4">glowing glass embers</h1>
          <p className="text-neutral-400 text-lg max-w-xl mx-auto">
            Drop local files. They settle as soft glowing embers of frosted glass with gentle upward spring motion and warm light. Individual notes or a shared caption. Batch-publish to the database with polished Discord embeds. Soft size warnings only. No hard limits. All prior desks remain fully intact. No traces of boosting.
          </p>
        </motion.div>

        <motion.div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          animate={{ scale: drag ? 1.01 : 1, borderColor: drag ? '#FF6B35' : 'rgba(255,255,255,0.08)' }}
          className="glass rounded-3xl p-8 mb-8 border-2 border-dashed transition-colors relative overflow-hidden"
        >
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-[#FF6B35]/40 rounded-full blur-sm"
                style={{ left: `${20 + i * 10}%`, bottom: '10%' }}
                animate={{ y: [0, -40, 0], opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
              />
            ))}
          </div>
          <div className="text-center py-8 relative">
            <p className="text-neutral-300 mb-2">drop files to kindle embers</p>
            <p className="text-xs text-neutral-500">any files · large files warned, never refused</p>
            <input
              type="file"
              multiple
              className="hidden"
              id="ember-input"
              onChange={(e) => {
                const selected = Array.from(e.target.files || []);
                if (selected.length) setFiles((prev) => [...prev, ...selected].slice(0, 16));
              }}
            />
            <label htmlFor="ember-input" className="mt-4 inline-block px-5 py-2 rounded-full bg-white/10 text-sm cursor-pointer hover:bg-white/15 transition">
              choose files
            </label>
          </div>

          <AnimatePresence>
            {files.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-6 space-y-3 relative">
                {files.map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 140, damping: 18, delay: i * 0.05 }}
                    className="glass rounded-2xl p-4 flex items-center gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{f.name}</p>
                      <p className="text-xs text-neutral-500">{formatBytes(f.size)}</p>
                    </div>
                    <input
                      value={notes[i] || ''}
                      onChange={(e) => setNotes((prev) => ({ ...prev, [i]: e.target.value }))}
                      placeholder="quiet note"
                      className="w-32 text-xs px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 outline-none"
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 relative">
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="optional shared caption for the embers"
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#FF6B35]/40"
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={!files.length || busy}
            onClick={publish}
            className="mt-4 w-full py-3 rounded-2xl bg-white text-black text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed relative"
          >
            {busy ? 'kindling embers…' : `publish ${files.length || ''} file${files.length === 1 ? '' : 's'}`}
          </motion.button>
        </motion.div>

        {results.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6 mb-10">
            <p className="text-sm text-[#FF6B35] mb-4">ember links</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {results.map((r) => (
                <div key={r.id} className="bg-white/5 rounded-2xl p-4">
                  <p className="text-sm truncate">{r.name}</p>
                  <div className="flex gap-2 mt-2">
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
            </div>
          </motion.div>
        )}

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold tracking-tight">recent ember shares</h2>
            <button onClick={loadRecent} className="text-xs text-neutral-500 hover:text-neutral-300">refresh</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {recent.map((item, i) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, type: 'spring', stiffness: 120, damping: 20 }}
                whileHover={{ y: -2 }}
                onClick={() => navigate('share', item.id)}
                className="rounded-2xl glass p-4 text-left"
              >
                <p className="text-sm truncate">{item.name}</p>
                <p className="text-xs text-neutral-500 mt-1">{formatBytes(item.size)}</p>
              </motion.button>
            ))}
            {!recent.length && <p className="text-sm text-neutral-500 col-span-full">no shares yet. drop some above.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
