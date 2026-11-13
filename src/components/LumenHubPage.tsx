import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from './Router';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';

function formatBytes(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(2) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

export default function LumenHubPage() {
  const { navigate } = useRouter();
  const [files, setFiles] = useState<File[]>([]);
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
    if (dropped.length) setFiles((prev) => [...prev, ...dropped].slice(0, 24));
  };

  const publish = async () => {
    if (!files.length || busy) return;
    setBusy(true);
    const next: typeof results = [];
    for (const file of files) {
      const warn = file.size > 40 * 1024 * 1024 ? 'large drop — may feel slow' : null;
      const res = await publishLocalFile(file, { caption: caption || undefined, color: '#0A84FF' });
      if (res.ok && res.id && res.embed) {
        next.push({ id: res.id, name: file.name, embed: res.embed, warn: res.warn || warn });
      }
    }
    setResults(next);
    setFiles([]);
    setCaption('');
    setBusy(false);
    loadRecent();
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="text-center mb-12"
        >
          <p className="text-[#0A84FF] text-sm font-medium tracking-wide mb-3">lumen hub</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-4">central file hosting</h1>
          <p className="text-neutral-400 text-lg max-w-xl mx-auto">
            Drop local files. They land in the shared database with polished Discord embeds on every link. Soft size warnings only. No hard limits.
          </p>
        </motion.div>

        <motion.div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          animate={{ scale: drag ? 1.01 : 1, borderColor: drag ? '#0A84FF' : 'rgba(255,255,255,0.08)' }}
          className="glass rounded-3xl p-8 mb-8 border-2 border-dashed transition-colors"
        >
          <div className="text-center py-8">
            <p className="text-neutral-300 mb-2">drop files here</p>
            <p className="text-xs text-neutral-500">or click to browse · large files warned, never refused</p>
            <input
              type="file"
              multiple
              className="hidden"
              id="hub-input"
              onChange={(e) => {
                const selected = Array.from(e.target.files || []);
                if (selected.length) setFiles((prev) => [...prev, ...selected].slice(0, 24));
              }}
            />
            <label htmlFor="hub-input" className="mt-4 inline-block px-5 py-2 rounded-full bg-white/10 text-sm cursor-pointer hover:bg-white/15 transition">
              choose files
            </label>
          </div>

          <AnimatePresence>
            {files.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-6 space-y-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between text-sm bg-white/5 rounded-2xl px-4 py-3">
                    <span className="truncate max-w-[70%]">{f.name}</span>
                    <span className="text-neutral-500 text-xs">{formatBytes(f.size)}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6">
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="optional shared caption"
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0A84FF]/40"
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={!files.length || busy}
            onClick={publish}
            className="mt-4 w-full py-3 rounded-2xl bg-white text-black text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {busy ? 'publishing…' : `publish ${files.length || ''} file${files.length === 1 ? '' : 's'}`}
          </motion.button>
        </motion.div>

        {results.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6 mb-10">
            <p className="text-sm text-[#0A84FF] mb-4">live links</p>
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
