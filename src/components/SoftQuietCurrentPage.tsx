import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';

type Item = { file: File; note: string; id: string };

export default function SoftQuietCurrentPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [sharedNote, setSharedNote] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<{ id: string; embed: string; warn?: string | null; name: string }[]>([]);
  const [error, setError] = useState('');
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listPublicShares(16).then(setShares);
  }, []);

  const addFiles = (files: FileList | File[]) => {
    const next: Item[] = Array.from(files).map((file) => ({
      file,
      note: '',
      id: Math.random().toString(36).slice(2, 10),
    }));
    setItems((prev) => [...prev, ...next]);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const shareAll = async () => {
    if (!items.length) return;
    setUploading(true);
    setError('');
    setResults([]);
    const out: typeof results = [];
    for (const item of items) {
      const caption = item.note.trim() || sharedNote.trim() || undefined;
      const res = await publishLocalFile(item.file, {
        caption,
        color: accent,
        cardTitle: caption || item.file.name,
      });
      if (res.ok && res.id && res.embed) {
        out.push({ id: res.id, embed: res.embed, warn: res.warn, name: item.file.name });
      } else {
        setError(res.error || `could not share ${item.file.name}`);
        break;
      }
    }
    setUploading(false);
    if (out.length) {
      setResults(out);
      setItems([]);
      setSharedNote('');
      listPublicShares(16).then(setShares);
    }
  };

  const totalMb = items.reduce((n, it) => n + it.file.size, 0) / 1024 / 1024;
  const isLarge = totalMb > 25;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 70, damping: 16 }}
          className="glass rounded-[36px] p-8 sm:p-10"
        >
          <p className="text-sm text-[#0A84FF] mb-3 tracking-wide font-medium">soft quiet current</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3 text-white">
            let it drift in the current.
          </h1>
          <p className="text-neutral-400 text-sm leading-relaxed mb-8">
            Drop one or many local files. Each can carry its own quiet note or share a current caption. Soft glass panels drift with spring motion. Lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned about possible slowness, never refused. All prior desks remain fully intact.
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
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
            <p className="text-neutral-400 text-sm">drop files or click to choose</p>
            {items.length > 0 && (
              <p className="text-xs text-neutral-500 mt-2">{items.length} in the current · {totalMb.toFixed(1)} MB</p>
            )}
          </div>

          {isLarge && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-amber-300/80 text-xs mb-4 text-center"
            >
              large current — the browser may feel slow while it sends. no hard limit.
            </motion.p>
          )}

          <AnimatePresence>
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 90, damping: 18, delay: i * 0.03 }}
                className="glass rounded-2xl p-4 mb-3 flex items-start gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{item.file.name}</p>
                  <p className="text-xs text-neutral-500">{(item.file.size / 1024 / 1024).toFixed(1)} MB</p>
                  <input
                    value={item.note}
                    onChange={(e) => setItems((prev) => prev.map((p) => p.id === item.id ? { ...p, note: e.target.value } : p))}
                    placeholder="quiet note for this file (optional)"
                    className="mt-2 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/20"
                  />
                </div>
                <button
                  onClick={() => setItems((prev) => prev.filter((p) => p.id !== item.id))}
                  className="text-neutral-500 hover:text-white text-xs px-2"
                >
                  remove
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          <input
            value={sharedNote}
            onChange={(e) => setSharedNote(e.target.value)}
            placeholder="shared current caption (optional, used if no individual note)"
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
            disabled={!items.length || uploading}
            onClick={shareAll}
            className="w-full py-3.5 rounded-full bg-[#0A84FF] text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#3a9aff] transition"
          >
            {uploading ? 'letting it drift…' : 'share the current'}
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
                <p className="text-sm text-neutral-300 text-center mb-2">shared</p>
                {results.map((r) => (
                  <div key={r.id} className="glass rounded-2xl p-4">
                    <p className="text-xs text-neutral-400 truncate mb-1">{r.name}</p>
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
            transition={{ delay: 0.35 }}
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
