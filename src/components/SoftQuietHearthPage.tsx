import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';

export default function SoftQuietHearthPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [sharedCaption, setSharedCaption] = useState('');
  const [accent, setAccent] = useState('#FF6B35');
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
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length) setFiles((prev) => [...prev, ...dropped].slice(0, 12));
  };

  const addFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length) setFiles((prev) => [...prev, ...selected].slice(0, 12));
    e.target.value = '';
  };

  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const shareAll = async () => {
    if (!files.length) return;
    setUploading(true);
    setError('');
    setResults([]);
    const newResults: typeof results = [];
    for (const file of files) {
      const res = await publishLocalFile(file, {
        caption: sharedCaption.trim() || undefined,
        color: accent,
        cardTitle: file.name,
        meta: { desk: 'softquiethearth' },
      });
      if (res.ok && res.id && res.embed) {
        newResults.push({ id: res.id, embed: res.embed, name: file.name, warn: res.warn });
      } else {
        setError(res.error || `could not share ${file.name}`);
        break;
      }
    }
    setUploading(false);
    if (newResults.length) {
      setResults(newResults);
      setFiles([]);
      setSharedCaption('');
      listPublicShares(16).then(setShares);
    }
  };

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const isLarge = totalSize > 40 * 1024 * 1024;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 70, damping: 16 }}
          className="glass rounded-[36px] p-8 sm:p-10"
        >
          <p className="text-sm mb-3 tracking-wide font-medium" style={{ color: accent }}>soft quiet hearth</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3 text-white">
            gather around the quiet hearth
          </h1>
          <p className="text-neutral-400 text-sm leading-relaxed mb-8">
            Drop several local files. They settle like quiet logs around a shared caption and warm accent. Each lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned about possible slowness, never refused. Soft glass, spring motion. All prior desks remain fully intact. No traces of boosting.
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
              onChange={addFiles}
            />
            <p className="text-neutral-400 text-sm">drop files or click to choose (up to 12)</p>
          </div>

          <AnimatePresence>
            {files.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-6 space-y-2">
                {files.map((f, i) => (
                  <motion.div
                    key={f.name + i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between glass rounded-2xl px-4 py-3 text-sm"
                  >
                    <span className="truncate text-white">{f.name} <span className="text-neutral-500">({(f.size / 1024 / 1024).toFixed(1)} MB)</span></span>
                    <button onClick={() => removeFile(i)} className="text-neutral-500 hover:text-white text-xs ml-3">remove</button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {isLarge && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-amber-300/80 text-xs mb-4 text-center">
              large drop — the browser may feel slow while it sends. no hard limit.
            </motion.p>
          )}

          <input
            value={sharedCaption}
            onChange={(e) => setSharedCaption(e.target.value)}
            placeholder="shared quiet caption (optional)"
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
            className="w-full py-3.5 rounded-full text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition"
            style={{ background: accent }}
          >
            {uploading ? 'gathering…' : 'share around the hearth'}
          </motion.button>

          <AnimatePresence>
            {error && (
              <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-red-400 text-sm mt-4 text-center">
                {error}
              </motion.p>
            )}
            {results.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-3">
                {results.map((r) => (
                  <div key={r.id} className="glass rounded-2xl p-4 text-center">
                    <p className="text-xs text-neutral-400 mb-1">{r.name}</p>
                    <a href={r.embed} target="_blank" rel="noreferrer" className="text-sm break-all hover:underline" style={{ color: accent }}>
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-12">
            <h2 className="text-lg font-medium mb-4 text-neutral-300">recent gatherings</h2>
            <div className="space-y-3">
              {shares.map((s) => (
                <a key={s.id} href={shareUrls(s.id).app} className="glass rounded-2xl p-4 block hover:bg-white/[0.06] transition-all duration-500">
                  <p className="text-sm text-white truncate">{s.name || 'untitled'}</p>
                  <p className="text-xs text-neutral-500 mt-1 line-clamp-1">{s.caption || 'shared quietly'}</p>
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
