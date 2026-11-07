import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';

export default function SoftConstellationDeskPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [captions, setCaptions] = useState<string[]>([]);
  const [collective, setCollective] = useState('');
  const [accent, setAccent] = useState('#5AC8FA');
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<{ id: string; embed: string; name: string; warn?: string | null }[]>([]);
  const [error, setError] = useState('');
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listPublicShares(16).then(setShares);
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const list = Array.from(e.dataTransfer.files);
    if (list.length) addFiles(list);
  };

  const addFiles = (list: File[]) => {
    setFiles((prev) => [...prev, ...list]);
    setCaptions((prev) => [...prev, ...list.map(() => '')]);
  };

  const updateCaption = (i: number, v: string) => {
    setCaptions((prev) => prev.map((c, idx) => (idx === i ? v : c)));
  };

  const removeFile = (i: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
    setCaptions((prev) => prev.filter((_, idx) => idx !== i));
  };

  const shareAll = async () => {
    if (!files.length) return;
    setUploading(true);
    setError('');
    setResults([]);
    const outs: typeof results = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const cap = (captions[i] || collective || '').trim();
      const res = await publishLocalFile(file, {
        caption: cap || undefined,
        color: accent,
        cardTitle: cap || file.name,
        meta: { constellation: true, collective: collective.trim() || null },
      });
      if (res.ok && res.id && res.embed) {
        outs.push({ id: res.id, embed: res.embed, name: file.name, warn: res.warn });
      } else {
        setError(res.error || `failed on ${file.name}`);
        break;
      }
    }
    setUploading(false);
    if (outs.length) {
      setResults(outs);
      setFiles([]);
      setCaptions([]);
      setCollective('');
      listPublicShares(16).then(setShares);
    }
  };

  const totalSize = files.reduce((n, f) => n + f.size, 0);
  const isLarge = totalSize > 40 * 1024 * 1024;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 70, damping: 16 }}
          className="glass rounded-[36px] p-8 sm:p-10"
        >
          <p className="text-sm text-[#5AC8FA] mb-3 tracking-wide font-medium">soft constellation desk</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3 text-white">
            drop several files. form a quiet constellation.
          </h1>
          <p className="text-neutral-400 text-sm leading-relaxed mb-8">
            Multi-file local upload. Each star can carry its own quiet note, or share one collective caption. Everything lands in the database with polished Discord embeds on every link. Large drops gently warned about possible slowness — never refused. Soft glass surfaces and spring-driven motion. All prior desks remain fully intact. No traces of boosting.
          </p>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className="border border-dashed border-white/15 rounded-3xl p-10 text-center cursor-pointer hover:border-white/30 hover:bg-white/[0.03] transition-all duration-500 mb-6"
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && addFiles(Array.from(e.target.files))}
            />
            <p className="text-neutral-400 text-sm">drop files or click to choose several</p>
          </div>

          <AnimatePresence>
            {files.map((f, i) => (
              <motion.div
                key={f.name + i + f.size}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                className="glass rounded-2xl p-4 mb-3 flex items-start gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{f.name}</p>
                  <p className="text-xs text-neutral-500">{(f.size / 1024 / 1024).toFixed(1)} MB</p>
                  <input
                    value={captions[i] || ''}
                    onChange={(e) => updateCaption(i, e.target.value)}
                    placeholder="quiet note for this star"
                    className="mt-2 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/20"
                  />
                </div>
                <button
                  onClick={() => removeFile(i)}
                  className="text-neutral-500 hover:text-white text-xs mt-1"
                >
                  remove
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLarge && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-amber-300/80 text-xs mb-4 text-center"
            >
              constellation is large — the browser may feel slow while it sends. no hard limit.
            </motion.p>
          )}

          <input
            value={collective}
            onChange={(e) => setCollective(e.target.value)}
            placeholder="collective caption for the constellation (optional)"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-neutral-500 mb-4 focus:outline-none focus:border-white/20"
          />

          <div className="flex items-center gap-3 mb-6">
            <span className="text-xs text-neutral-500">accent</span>
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="w-10 h-10 rounded-full border border-white/20 cursor-pointer bg-transparent"
            />
            <span className="text-xs text-neutral-400">{accent}</span>
          </div>

          <motion.button
            whileTap={{ scale: 0.96 }}
            disabled={!files.length || uploading}
            onClick={shareAll}
            className="w-full py-3.5 rounded-full bg-[#5AC8FA] text-black text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#6ed0fb] transition"
          >
            {uploading ? 'forming constellation…' : 'share the constellation'}
          </motion.button>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-red-400 text-sm mt-4 text-center"
              >
                {error}
              </motion.p>
            )}
            {results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 space-y-3"
              >
                <p className="text-sm text-neutral-300 text-center mb-2">constellation shared</p>
                {results.map((r) => (
                  <div key={r.id} className="glass rounded-2xl p-4 text-center">
                    <p className="text-xs text-neutral-400 mb-1">{r.name}</p>
                    <a
                      href={r.embed}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#5AC8FA] text-sm break-all hover:underline"
                    >
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-12"
          >
            <h2 className="text-lg font-medium mb-4 text-neutral-300">recent quiet shares</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {shares.map((s) => (
                <a
                  key={s.id}
                  href={shareUrls(s.id).app}
                  className="glass rounded-2xl p-4 block hover:bg-white/[0.06] transition-all duration-500"
                >
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
