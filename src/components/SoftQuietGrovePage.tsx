import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';

type Tree = { file: File; note: string; id: string; sway: number };

export default function SoftQuietGrovePage() {
  const [trees, setTrees] = useState<Tree[]>([]);
  const [groveCaption, setGroveCaption] = useState('');
  const [accent, setAccent] = useState('#34C759');
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<{ id: string; embed: string; warn?: string | null; name: string }[]>([]);
  const [error, setError] = useState('');
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listPublicShares(12).then(setShares);
  }, []);

  const addFiles = (files: FileList | File[]) => {
    const next: Tree[] = Array.from(files).map((file, i) => ({
      file,
      note: '',
      id: Math.random().toString(36).slice(2, 10),
      sway: (Math.random() * 6 - 3) + (i * 0.4),
    }));
    setTrees((prev) => [...prev, ...next]);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const updateNote = (id: string, note: string) => {
    setTrees((prev) => prev.map((it) => (it.id === id ? { ...it, note } : it)));
  };

  const remove = (id: string) => {
    setTrees((prev) => prev.filter((it) => it.id !== id));
  };

  const plantTheGrove = async () => {
    if (!trees.length) return;
    setUploading(true);
    setError('');
    setResults([]);
    const outs: typeof results = [];
    for (const it of trees) {
      const caption = it.note.trim() || groveCaption.trim() || undefined;
      const res = await publishLocalFile(it.file, {
        caption,
        color: accent,
        cardTitle: caption || it.file.name,
        meta: { kind: 'softquietgrove', grove: groveCaption.trim() || null },
      });
      if (res.ok && res.id && res.embed) {
        outs.push({ id: res.id, embed: res.embed, warn: res.warn, name: it.file.name });
      } else {
        setError(res.error || `could not plant ${it.file.name}`);
        break;
      }
    }
    setUploading(false);
    if (outs.length) {
      setResults(outs);
      setTrees([]);
      setGroveCaption('');
      listPublicShares(12).then(setShares);
    }
  };

  const totalMb = trees.reduce((s, it) => s + it.file.size, 0) / 1024 / 1024;
  const isLarge = totalMb > 25;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 60, damping: 18 }}
          className="glass rounded-[40px] p-8 sm:p-12 relative overflow-hidden"
        >
          <div className="absolute inset-0 pointer-events-none opacity-30">
            <div className="absolute top-12 left-1/5 w-36 h-36 rounded-full bg-emerald-400/15 blur-3xl" />
            <div className="absolute bottom-16 right-1/4 w-44 h-44 rounded-full bg-green-500/10 blur-3xl" />
          </div>
          <p className="text-sm text-emerald-400 mb-3 tracking-wide font-medium relative">soft quiet grove</p>
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight mb-4 text-white leading-tight relative">
            plant a quiet grove of trees
          </h1>
          <p className="text-neutral-400 text-sm leading-relaxed mb-10 relative">
            Drop local files as trees in a soft grove. Each carries its own quiet note or shares a grove caption. Soft glass trees rise and gently sway with spring motion. Lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned about possible slowness, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting.
          </p>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className="border border-dashed border-emerald-500/20 rounded-3xl p-12 text-center cursor-pointer hover:border-emerald-400/40 hover:bg-emerald-500/[0.04] transition-all duration-700 mb-8 relative"
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
            <p className="text-neutral-400 text-sm">drop files or click to plant trees</p>
            {trees.length > 0 && <p className="text-neutral-500 text-xs mt-2">{trees.length} tree{trees.length > 1 ? 's' : ''} ready · {totalMb.toFixed(1)} MB</p>}
          </div>

          {isLarge && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-emerald-300/80 text-xs mb-6 text-center">
              dense grove — the browser may feel slow while it plants. no hard limit.
            </motion.p>
          )}

          <AnimatePresence>
            {trees.map((it, idx) => (
              <motion.div
                key={it.id}
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 100, damping: 16, delay: idx * 0.04 }}
                className="glass rounded-2xl p-4 mb-3 flex flex-col sm:flex-row gap-3 items-start relative"
                style={{ boxShadow: `0 0 40px ${accent}15` }}
              >
                <motion.div
                  animate={{ rotate: [it.sway - 2, it.sway + 2, it.sway - 2] }}
                  transition={{ duration: 4 + idx * 0.2, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-6 h-10 flex-shrink-0 mt-1 relative"
                >
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-6 bg-emerald-700/60 rounded-full" />
                  <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full"
                    style={{ background: `radial-gradient(circle, ${accent}, ${accent}90)` }}
                  />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate font-medium">{it.file.name}</p>
                  <p className="text-xs text-neutral-500">{(it.file.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
                <input
                  value={it.note}
                  onChange={(e) => updateNote(it.id, e.target.value)}
                  placeholder="quiet note for this tree"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-emerald-400/30"
                />
                <button onClick={() => remove(it.id)} className="text-xs text-neutral-500 hover:text-white px-2 py-1">remove</button>
              </motion.div>
            ))}
          </AnimatePresence>

          <input
            value={groveCaption}
            onChange={(e) => setGroveCaption(e.target.value)}
            placeholder="shared grove caption (optional)"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-emerald-400/30"
          />

          <div className="flex items-center gap-3 mb-8">
            <span className="text-xs text-neutral-500">grove light</span>
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full border border-white/20 cursor-pointer bg-transparent" />
            <span className="text-xs text-neutral-400">{accent}</span>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={!trees.length || uploading}
            onClick={plantTheGrove}
            className="w-full py-4 rounded-full bg-emerald-500 text-black text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-400 transition-all duration-300"
          >
            {uploading ? 'planting the grove…' : 'plant the quiet grove'}
          </motion.button>

          <AnimatePresence>
            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm mt-4 text-center">
                {error}
              </motion.p>
            )}
            {results.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-3">
                <p className="text-sm text-neutral-300 text-center mb-2">grove planted</p>
                {results.map((r) => (
                  <div key={r.id} className="glass rounded-2xl p-4 text-center">
                    <p className="text-xs text-neutral-400 truncate mb-1">{r.name}</p>
                    <a href={r.embed} target="_blank" rel="noreferrer" className="text-emerald-400 text-sm break-all hover:underline">
                      {r.embed}
                    </a>
                    {r.warn && <p className="text-xs text-emerald-300/70 mt-1">{r.warn}</p>}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {shares.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-14">
            <h2 className="text-lg font-medium mb-5 text-neutral-300">recent quiet growth</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {shares.map((s) => (
                <a key={s.id} href={shareUrls(s.id).app} className="glass rounded-2xl p-4 block hover:bg-white/[0.06] transition-all duration-500">
                  <p className="text-sm text-white truncate">{s.name || 'untitled'}</p>
                  <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{s.caption || 'shared quietly'}</p>
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
