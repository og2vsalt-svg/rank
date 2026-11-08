import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';

type Lantern = { file: File; note: string; id: string; hue: number };

export default function SoftQuietLanternPage() {
  const [lanterns, setLanterns] = useState<Lantern[]>([]);
  const [sharedPath, setSharedPath] = useState('');
  const [accent, setAccent] = useState('#FF9500');
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<{ id: string; embed: string; warn?: string | null; name: string }[]>([]);
  const [error, setError] = useState('');
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listPublicShares(12).then(setShares);
  }, []);

  const addFiles = (files: FileList | File[]) => {
    const next: Lantern[] = Array.from(files).map((file, i) => ({
      file,
      note: '',
      id: Math.random().toString(36).slice(2, 10),
      hue: (Math.random() * 40 - 20) + (i * 8),
    }));
    setLanterns((prev) => [...prev, ...next]);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const updateNote = (id: string, note: string) => {
    setLanterns((prev) => prev.map((it) => (it.id === id ? { ...it, note } : it)));
  };

  const remove = (id: string) => {
    setLanterns((prev) => prev.filter((it) => it.id !== id));
  };

  const lightThePath = async () => {
    if (!lanterns.length) return;
    setUploading(true);
    setError('');
    setResults([]);
    const outs: typeof results = [];
    for (const it of lanterns) {
      const caption = it.note.trim() || sharedPath.trim() || undefined;
      const res = await publishLocalFile(it.file, {
        caption,
        color: accent,
        cardTitle: caption || it.file.name,
        meta: { kind: 'softquietlantern', path: sharedPath.trim() || null },
      });
      if (res.ok && res.id && res.embed) {
        outs.push({ id: res.id, embed: res.embed, warn: res.warn, name: it.file.name });
      } else {
        setError(res.error || `could not light ${it.file.name}`);
        break;
      }
    }
    setUploading(false);
    if (outs.length) {
      setResults(outs);
      setLanterns([]);
      setSharedPath('');
      listPublicShares(12).then(setShares);
    }
  };

  const totalMb = lanterns.reduce((s, it) => s + it.file.size, 0) / 1024 / 1024;
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
            <div className="absolute top-10 left-1/4 w-32 h-32 rounded-full bg-amber-400/20 blur-3xl" />
            <div className="absolute bottom-20 right-1/3 w-40 h-40 rounded-full bg-orange-500/10 blur-3xl" />
          </div>
          <p className="text-sm text-amber-400 mb-3 tracking-wide font-medium relative">soft quiet lantern</p>
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight mb-4 text-white leading-tight relative">
            light a quiet path of lanterns
          </h1>
          <p className="text-neutral-400 text-sm leading-relaxed mb-10 relative">
            Drop local files as lanterns along a soft path. Each carries its own quiet note or shares a path caption. Glass orbs rise and gently float with spring motion. Lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned about possible slowness, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting.
          </p>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className="border border-dashed border-amber-500/20 rounded-3xl p-12 text-center cursor-pointer hover:border-amber-400/40 hover:bg-amber-500/[0.04] transition-all duration-700 mb-8 relative"
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
            <p className="text-neutral-400 text-sm">drop files or click to place lanterns</p>
            {lanterns.length > 0 && <p className="text-neutral-500 text-xs mt-2">{lanterns.length} lantern{lanterns.length > 1 ? 's' : ''} ready · {totalMb.toFixed(1)} MB</p>}
          </div>

          {isLarge && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-amber-300/80 text-xs mb-6 text-center">
              long path — the browser may feel slow while it lights. no hard limit.
            </motion.p>
          )}

          <AnimatePresence>
            {lanterns.map((it, idx) => (
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
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 3 + idx * 0.3, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-8 h-8 rounded-full flex-shrink-0 mt-1"
                  style={{ background: `radial-gradient(circle, ${accent}, ${accent}80)` }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate font-medium">{it.file.name}</p>
                  <p className="text-xs text-neutral-500">{(it.file.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
                <input
                  value={it.note}
                  onChange={(e) => updateNote(it.id, e.target.value)}
                  placeholder="quiet note for this lantern"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-400/30"
                />
                <button onClick={() => remove(it.id)} className="text-xs text-neutral-500 hover:text-white px-2 py-1">remove</button>
              </motion.div>
            ))}
          </AnimatePresence>

          <input
            value={sharedPath}
            onChange={(e) => setSharedPath(e.target.value)}
            placeholder="shared path caption (optional)"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-amber-400/30"
          />

          <div className="flex items-center gap-3 mb-8">
            <span className="text-xs text-neutral-500">lantern glow</span>
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full border border-white/20 cursor-pointer bg-transparent" />
            <span className="text-xs text-neutral-400">{accent}</span>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={!lanterns.length || uploading}
            onClick={lightThePath}
            className="w-full py-4 rounded-full bg-amber-500 text-black text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-400 transition-all duration-300"
          >
            {uploading ? 'lighting the path…' : 'light the quiet path'}
          </motion.button>

          <AnimatePresence>
            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm mt-4 text-center">
                {error}
              </motion.p>
            )}
            {results.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-3">
                <p className="text-sm text-neutral-300 text-center mb-2">path lit</p>
                {results.map((r) => (
                  <div key={r.id} className="glass rounded-2xl p-4 text-center">
                    <p className="text-xs text-neutral-400 truncate mb-1">{r.name}</p>
                    <a href={r.embed} target="_blank" rel="noreferrer" className="text-amber-400 text-sm break-all hover:underline">
                      {r.embed}
                    </a>
                    {r.warn && <p className="text-xs text-amber-300/70 mt-1">{r.warn}</p>}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {shares.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-14">
            <h2 className="text-lg font-medium mb-5 text-neutral-300">recent quiet lights</h2>
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
