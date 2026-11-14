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

export default function QuietAlbumPage() {
  const { navigate } = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<{ id: string; name: string; embed: string; warn?: string | null; preview?: string }[]>([]);
  const [recent, setRecent] = useState<CloudMeta[]>([]);
  const [drag, setDrag] = useState(false);

  const loadRecent = useCallback(async () => {
    const list = await listPublicShares(16);
    setRecent(list.filter(item => item.type.startsWith('image/')));
  }, []);

  useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const dropped = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (dropped.length) setFiles((prev) => [...prev, ...dropped].slice(0, 20));
  };

  const publish = async () => {
    if (!files.length || busy) return;
    setBusy(true);
    const next: typeof results = [];
    for (const file of files) {
      const warn = file.size > 25 * 1024 * 1024 ? 'large image — may feel slow to settle' : null;
      const res = await publishLocalFile(file, { caption: caption || undefined, color: '#AF52DE' });
      if (res.ok && res.id && res.embed) {
        const preview = URL.createObjectURL(file);
        next.push({ id: res.id, name: file.name, embed: res.embed, warn: res.warn || warn, preview });
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
      <div className="pt-28 pb-24 px-5 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="text-center mb-12"
        >
          <p className="text-[#AF52DE] text-sm font-medium tracking-wide mb-3">quiet album</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-4">image-focused hosting</h1>
          <p className="text-neutral-400 text-lg max-w-xl mx-auto">
            Drop photos. They settle into a soft album of frosted glass cards with spring motion. Batch-publish to the shared database with polished Discord embeds. Soft size warnings only. No hard limits.
          </p>
        </motion.div>

        <motion.div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          animate={{ scale: drag ? 1.01 : 1, borderColor: drag ? '#AF52DE' : 'rgba(255,255,255,0.08)' }}
          className="glass rounded-3xl p-8 mb-8 border-2 border-dashed transition-colors"
        >
          <div className="text-center py-8">
            <p className="text-neutral-300 mb-2">drop images here</p>
            <p className="text-xs text-neutral-500">photos only · large files warned, never refused</p>
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              id="album-input"
              onChange={(e) => {
                const selected = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'));
                if (selected.length) setFiles((prev) => [...prev, ...selected].slice(0, 20));
              }}
            />
            <label htmlFor="album-input" className="mt-4 inline-block px-5 py-2 rounded-full bg-white/10 text-sm cursor-pointer hover:bg-white/15 transition">
              choose photos
            </label>
          </div>

          <AnimatePresence>
            {files.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {files.map((f, i) => (
                  <motion.div key={i} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative aspect-square rounded-2xl overflow-hidden bg-white/5">
                    <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-sm text-xs p-2 truncate">{f.name}</div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6">
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="optional shared caption for the album"
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#AF52DE]/40"
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={!files.length || busy}
            onClick={publish}
            className="mt-4 w-full py-3 rounded-2xl bg-white text-black text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {busy ? 'settling…' : `publish ${files.length || ''} photo${files.length === 1 ? '' : 's'}`}
          </motion.button>
        </motion.div>

        {results.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6 mb-10">
            <p className="text-sm text-[#AF52DE] mb-4">album links</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {results.map((r) => (
                <div key={r.id} className="bg-white/5 rounded-2xl overflow-hidden">
                  {r.preview && <img src={r.preview} alt="" className="w-full aspect-video object-cover" />}
                  <div className="p-4">
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
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold tracking-tight">recent image shares</h2>
            <button onClick={loadRecent} className="text-xs text-neutral-500 hover:text-neutral-300">refresh</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {recent.map((item) => (
              <motion.button
                key={item.id}
                whileHover={{ y: -2 }}
                onClick={() => navigate('share', item.id)}
                className="aspect-square rounded-2xl overflow-hidden bg-white/5 relative group"
              >
                {item.fileUrl && <img src={item.fileUrl} alt="" className="w-full h-full object-cover" />}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-end p-2">
                  <p className="text-xs truncate opacity-0 group-hover:opacity-100">{item.name}</p>
                </div>
              </motion.button>
            ))}
            {!recent.length && <p className="text-sm text-neutral-500 col-span-full">no image shares yet. drop some above.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
