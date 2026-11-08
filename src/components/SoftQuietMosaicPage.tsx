import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';

export default function SoftQuietMosaicPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [sharedCaption, setSharedCaption] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
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

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length) setFiles((prev) => [...prev, ...selected].slice(0, 12));
  };

  const updateNote = (name: string, note: string) => {
    setNotes((prev) => ({ ...prev, [name]: note }));
  };

  const shareAll = async () => {
    if (!files.length) return;
    setUploading(true);
    setError('');
    setResults([]);
    const outs: typeof results = [];
    for (const file of files) {
      const note = notes[file.name] || sharedCaption.trim() || undefined;
      const res = await publishLocalFile(file, {
        caption: note,
        color: accent,
        cardTitle: note || file.name,
        meta: { mosaic: true, shared: sharedCaption.trim() || null },
      });
      if (res.ok && res.id && res.embed) {
        outs.push({ id: res.id, embed: res.embed, name: file.name, warn: res.warn });
      } else {
        setError(res.error || `could not share ${file.name}`);
        break;
      }
    }
    setUploading(false);
    if (outs.length) {
      setResults(outs);
      setFiles([]);
      setNotes({});
      setSharedCaption('');
      listPublicShares(16).then(setShares);
    }
  };

  const totalMb = files.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024;
  const isLarge = totalMb > 40;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
          className="glass rounded-[36px] p-8 sm:p-10"
        >
          <p className="text-sm text-[#0A84FF] mb-3 tracking-wide font-medium">soft quiet mosaic</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3 text-white">
            arrange a quiet mosaic of files
          </h1>
          <p className="text-neutral-400 text-sm leading-relaxed mb-8">
            Drop several local files. Each can carry its own quiet note, or share one caption across the mosaic. Soft glass tiles settle with spring motion. Lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned about possible slowness, never refused. All prior desks remain fully intact. No traces of boosting.
          </p>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className="border border-dashed border-white/15 rounded-3xl p-12 text-center cursor-pointer hover:border-white/30 hover:bg-white/[0.03] transition-all duration-500 mb-6"
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={onSelect}
            />
            <p className="text-neutral-400 text-sm">drop files or click to choose (up to 12)</p>
            {files.length > 0 && (
              <p className="text-white text-sm mt-2">{files.length} file{files.length > 1 ? 's' : ''} ready · {totalMb.toFixed(1)} MB</p>
            )}
          </div>

          {isLarge && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-amber-300/80 text-xs mb-4 text-center"
            >
              large mosaic — the browser may feel slow while it sends. no hard limit.
            </motion.p>
          )}

          {files.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {files.map((f) => (
                <div key={f.name + f.size} className="glass rounded-2xl p-4">
                  <p className="text-sm text-white truncate mb-2">{f.name}</p>
                  <input
                    value={notes[f.name] || ''}
                    onChange={(e) => updateNote(f.name, e.target.value)}
                    placeholder="quiet note for this file"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/20"
                  />
                </div>
              ))}
            </div>
          )}

          <input
            value={sharedCaption}
            onChange={(e) => setSharedCaption(e.target.value)}
            placeholder="shared mosaic caption (optional)"
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
            className="w-full py-3.5 rounded-full bg-[#0A84FF] text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#3a9aff] transition"
          >
            {uploading ? 'sharing mosaic…' : 'share the mosaic'}
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
                <p className="text-sm text-neutral-300 text-center mb-2">mosaic shared</p>
                {results.map((r) => (
                  <div key={r.id} className="glass rounded-2xl p-4">
                    <p className="text-xs text-neutral-500 truncate mb-1">{r.name}</p>
                    <a
                      href={r.embed}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#0A84FF] text-sm break-all hover:underline"
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
            transition={{ delay: 0.3 }}
            className="mt-12"
          >
            <h2 className="text-lg font-medium mb-4 text-neutral-300">recent quiet shares</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
