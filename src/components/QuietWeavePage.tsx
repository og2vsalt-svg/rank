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

export default function QuietWeavePage() {
  const { navigate } = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [shared, setShared] = useState('');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<{ id: string; name: string; embed: string; warn?: string | null }[]>([]);
  const [recent, setRecent] = useState<CloudMeta[]>([]);
  const [drag, setDrag] = useState(false);

  const loadRecent = useCallback(async () => {
    const list = await listPublicShares(16);
    setRecent(list);
  }, []);

  useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length) setFiles((prev) => [...prev, ...dropped].slice(0, 12));
  };

  const publish = async () => {
    if (!files.length || busy) return;
    setBusy(true);
    const next: typeof results = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const caption = notes[i] || shared || undefined;
      const warn = file.size > 28 * 1024 * 1024 ? 'large strand — may take a quiet moment to weave in' : null;
      const res = await publishLocalFile(file, { caption, color: '#FF9F0A' });
      if (res.ok && res.id && res.embed) {
        next.push({ id: res.id, name: file.name, embed: res.embed, warn: res.warn || warn });
      }
    }
    setResults(next);
    setFiles([]);
    setNotes({});
    setShared('');
    setBusy(false);
    loadRecent();
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 95, damping: 21 }}
          className="text-center mb-12"
        >
          <p className="text-[#FF9F0A] text-sm font-medium tracking-wide mb-3">quiet weave</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-4">files as soft strands</h1>
          <p className="text-neutral-400 text-lg max-w-xl mx-auto">
            Drop local files. They settle as interwoven frosted glass strands with gentle spring motion. Individual notes or a shared caption. Batch-publish to the database with polished Discord embeds. Soft size warnings only. No hard limits.
          </p>
        </motion.div>

        <motion.div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          animate={{ scale: drag ? 1.008 : 1, borderColor: drag ? '#FF9F0A' : 'rgba(255,255,255,0.08)' }}
          className="glass rounded-3xl p-8 mb-8 border-2 border-dashed"
        >
          <div className="text-center py-8">
            <p className="text-neutral-300 mb-2">drop files to weave them in</p>
            <p className="text-xs text-neutral-500">any files · large drops warned softly, never refused</p>
            <input
              type="file"
              multiple
              className="hidden"
              id="weave-input"
              onChange={(e) => {
                const selected = Array.from(e.target.files || []);
                if (selected.length) setFiles((prev) => [...prev, ...selected].slice(0, 12));
              }}
            />
            <label htmlFor="weave-input" className="mt-4 inline-block px-5 py-2 rounded-full bg-white/10 text-sm cursor-pointer hover:bg-white/15 transition">
              choose files
            </label>
          </div>

          <AnimatePresence>
            {files.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-6 space-y-3">
                {files.map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.06, type: 'spring', stiffness: 130, damping: 17 }}
                    className="flex items-center gap-3 bg-white/5 rounded-2xl p-4"
                  >
                    <div className="w-2 h-8 rounded-full bg-[#FF9F0A]/40" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{f.name}</p>
                      <p className="text-xs text-neutral-500">{formatBytes(f.size)}</p>
                    </div>
                    <input
                      value={notes[i] || ''}
                      onChange={(e) => setNotes((prev) => ({ ...prev, [i]: e.target.value }))}
                      placeholder="strand note"
                      className="w-32 px-3 py-1.5 rounded-xl bg-black/20 border border-white/10 text-xs outline-none"
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6">
            <input
              value={shared}
              onChange={(e) => setShared(e.target.value)}
              placeholder="optional shared caption for the weave"
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#FF9F0A]/40"
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={!files.length || busy}
            onClick={publish}
            className="mt-4 w-full py-3 rounded-2xl bg-white text-black text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {busy ? 'weaving in…' : `publish ${files.length || ''} strand${files.length === 1 ? '' : 's'}`}
          </motion.button>
        </motion.div>

        {results.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6 mb-10">
            <p className="text-sm text-[#FF9F0A] mb-4">weave links</p>
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
            <h2 className="text-xl font-semibold tracking-tight">recent woven pieces</h2>
            <button onClick={loadRecent} className="text-xs text-neutral-500 hover:text-neutral-300">refresh</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {recent.map((item) => (
              <motion.button
                key={item.id}
                whileHover={{ y: -2 }}
                onClick={() => navigate('share', item.id)}
                className="rounded-2xl bg-white/5 p-4 text-left"
              >
                <p className="text-sm truncate">{item.name}</p>
                <p className="text-xs text-neutral-500 mt-1">{formatBytes(item.size)}</p>
              </motion.button>
            ))}
            {!recent.length && <p className="text-sm text-neutral-500 col-span-full">nothing woven yet. drop files above.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
