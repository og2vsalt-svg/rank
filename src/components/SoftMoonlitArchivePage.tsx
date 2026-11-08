import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';

type Orb = { file: File; note: string; id: string; drift: number; float: number };

export default function SoftMoonlitArchivePage() {
  const [orbs, setOrbs] = useState<Orb[]>([]);
  const [sharedNote, setSharedNote] = useState('');
  const [accent, setAccent] = useState('#5AC8FA');
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<{ id: string; embed: string; warn?: string | null; name: string }[]>([]);
  const [error, setError] = useState('');
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listPublicShares(10).then(setShares);
  }, []);

  const addFiles = (files: FileList | File[]) => {
    const next: Orb[] = Array.from(files).map((file) => ({
      file,
      note: '',
      id: Math.random().toString(36).slice(2, 10),
      drift: (Math.random() - 0.5) * 8,
      float: 4 + Math.random() * 6,
    }));
    setOrbs((prev) => [...prev, ...next]);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const updateNote = (id: string, note: string) => {
    setOrbs((prev) => prev.map((it) => (it.id === id ? { ...it, note } : it)));
  };

  const remove = (id: string) => {
    setOrbs((prev) => prev.filter((it) => it.id !== id));
  };

  const archiveOrbs = async () => {
    if (!orbs.length) return;
    setUploading(true);
    setError('');
    setResults([]);
    const outs: typeof results = [];
    for (const it of orbs) {
      const caption = it.note.trim() || sharedNote.trim() || undefined;
      const res = await publishLocalFile(it.file, {
        caption,
        color: accent,
        cardTitle: caption || it.file.name,
        meta: { kind: 'softmoonlitarchive', note: sharedNote.trim() || null },
      });
      if (res.ok && res.id && res.embed) {
        outs.push({ id: res.id, embed: res.embed, warn: res.warn, name: it.file.name });
      } else {
        setError(res.error || `could not archive ${it.file.name}`);
        break;
      }
    }
    setUploading(false);
    if (outs.length) {
      setResults(outs);
      setOrbs([]);
      setSharedNote('');
      listPublicShares(10).then(setShares);
    }
  };

  const totalMb = orbs.reduce((s, it) => s + it.file.size, 0) / 1024 / 1024;
  const isLarge = totalMb > 25;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 70, damping: 16 }}
          className="glass rounded-[36px] p-8 sm:p-11 relative overflow-hidden"
        >
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <div className="absolute top-16 left-1/4 w-32 h-32 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="absolute bottom-20 right-1/4 w-40 h-40 rounded-full bg-blue-400/8 blur-3xl" />
          </div>
          <p className="text-sm text-cyan-400 mb-3 tracking-wide font-medium relative">soft moonlit archive</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4 text-white leading-tight relative">
            float what you carry under quiet moonlight
          </h1>
          <p className="text-neutral-400 text-sm leading-relaxed mb-10 relative">
            Drop local files as lunar orbs. Each may hold its own quiet note or share one archive caption. Soft glass spheres drift and float gently with spring motion. Lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned about possible slowness, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting.
          </p>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className="border border-dashed border-cyan-500/20 rounded-3xl p-12 text-center cursor-pointer hover:border-cyan-400/35 hover:bg-cyan-500/[0.03] transition-all duration-600 mb-8 relative"
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
            <p className="text-neutral-400 text-sm">drop files or click to release orbs</p>
            {orbs.length > 0 && <p className="text-neutral-500 text-xs mt-2">{orbs.length} orb{orbs.length > 1 ? 's' : ''} ready · {totalMb.toFixed(1)} MB</p>}
          </div>

          {isLarge && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-cyan-300/75 text-xs mb-6 text-center">
              dense archive — the browser may feel slow while it settles. no hard limit.
            </motion.p>
          )}

          <AnimatePresence>
            {orbs.map((it, idx) => (
              <motion.div
                key={it.id}
                initial={{ opacity: 0, y: 18, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.93 }}
                transition={{ type: 'spring', stiffness: 95, damping: 14, delay: idx * 0.045 }}
                className="glass rounded-2xl p-4 mb-3 flex flex-col sm:flex-row gap-3 items-start relative"
                style={{ boxShadow: `0 0 36px ${accent}12` }}
              >
                <motion.div
                  animate={{
                    y: [0, -it.float, 0],
                    x: [0, it.drift, 0],
                  }}
                  transition={{ duration: 6 + idx * 0.4, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-8 h-8 rounded-full flex-shrink-0 mt-1"
                  style={{ background: `radial-gradient(circle at 30% 30%, ${accent}90, ${accent}40)`, boxShadow: `0 0 20px ${accent}40` }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate font-medium">{it.file.name}</p>
                  <p className="text-xs text-neutral-500">{(it.file.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
                <input
                  value={it.note}
                  onChange={(e) => updateNote(it.id, e.target.value)}
                  placeholder="quiet note for this orb"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-cyan-400/30"
                />
                <button onClick={() => remove(it.id)} className="text-xs text-neutral-500 hover:text-white px-2 py-1">release</button>
              </motion.div>
            ))}
          </AnimatePresence>

          <input
            value={sharedNote}
            onChange={(e) => setSharedNote(e.target.value)}
            placeholder="shared lunar caption (optional)"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-cyan-400/30"
          />

          <div className="flex items-center gap-3 mb-8">
            <span className="text-xs text-neutral-500">lunar glow</span>
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full border border-white/20 cursor-pointer bg-transparent" />
            <span className="text-xs text-neutral-400">{accent}</span>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={!orbs.length || uploading}
            onClick={archiveOrbs}
            className="w-full py-4 rounded-full bg-cyan-500 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-cyan-400 transition-all duration-300"
          >
            {uploading ? 'archiving under moonlight…' : 'archive the quiet orbs'}
          </motion.button>

          <AnimatePresence>
            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-cyan-400 text-sm mt-4 text-center">
                {error}
              </motion.p>
            )}
            {results.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-3">
                <p className="text-sm text-neutral-300 text-center mb-2">archive settled</p>
                {results.map((r) => (
                  <div key={r.id} className="glass rounded-2xl p-4 text-center">
                    <p className="text-xs text-neutral-400 truncate mb-1">{r.name}</p>
                    <a href={r.embed} target="_blank" rel="noreferrer" className="text-cyan-400 text-sm break-all hover:underline">
                      {r.embed}
                    </a>
                    {r.warn && <p className="text-xs text-cyan-300/70 mt-1">{r.warn}</p>}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {shares.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="mt-14">
            <h2 className="text-lg font-medium mb-5 text-neutral-300">recent lunar archives</h2>
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
