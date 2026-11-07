import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';

type Item = { file: File; note: string };

export default function SoftLumenHaloPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [accent, setAccent] = useState('#0A84FF');
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<{ id: string; name: string; embed: string; warn?: string | null }[]>([]);
  const [error, setError] = useState('');
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listPublicShares(14).then(setShares);
  }, []);

  const addFiles = (list: File[]) => {
    setItems((prev) => [...prev, ...list.map((file) => ({ file, note: '' }))]);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    addFiles(Array.from(e.dataTransfer.files || []));
  };

  const onChoose = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files || []));
    e.target.value = '';
  };

  const setNote = (i: number, note: string) => {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, note } : it)));
  };

  const removeAt = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const shareAll = async () => {
    if (!items.length) return;
    setUploading(true);
    setError('');
    setResults([]);
    const made: typeof results = [];
    for (const it of items) {
      const res = await publishLocalFile(it.file, {
        caption: it.note.trim() || undefined,
        color: accent,
        cardTitle: it.note.trim() || it.file.name,
        meta: { desk: 'softlumenhalo' },
      });
      if (res.ok && res.id && res.embed) {
        made.push({ id: res.id, name: it.file.name, embed: res.embed, warn: res.warn });
      } else {
        setError(res.error || `could not share ${it.file.name}`);
        break;
      }
    }
    setUploading(false);
    if (made.length) {
      setResults(made);
      setItems([]);
      listPublicShares(14).then(setShares);
    }
  };

  const totalMb = items.reduce((n, it) => n + it.file.size, 0) / 1024 / 1024;
  const isLarge = totalMb > 25;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 75, damping: 17 }}
          className="glass rounded-[36px] p-8 sm:p-10"
        >
          <p className="text-sm text-[#0A84FF] mb-3 tracking-wide font-medium">soft lumen halo</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3 text-white">
            arrange what you carry in a quiet halo.
          </h1>
          <p className="text-neutral-400 text-sm leading-relaxed mb-8">
            Drop several local files. Give each its own quiet note. Soft glass cards orbit with spring motion. Lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned about possible slowness — never refused. All prior desks remain fully intact. No traces of boosting.
          </p>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className="border border-dashed border-white/15 rounded-3xl p-10 text-center cursor-pointer hover:border-white/30 hover:bg-white/[0.03] transition-all duration-500 mb-6"
          >
            <input ref={inputRef} type="file" multiple className="hidden" onChange={onChoose} />
            {items.length ? (
              <div className="space-y-3 text-left">
                {items.map((it, i) => (
                  <motion.div
                    key={it.file.name + i + it.file.size}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/[0.04] rounded-2xl p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-white truncate pr-2">{it.file.name}</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeAt(i); }}
                        className="text-xs text-neutral-500 hover:text-white"
                      >
                        remove
                      </button>
                    </div>
                    <input
                      value={it.note}
                      onChange={(e) => setNote(i, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="quiet note for this file"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/20"
                    />
                  </motion.div>
                ))}
                <p className="text-neutral-500 text-xs pt-1 text-center">{items.length} file{items.length === 1 ? '' : 's'} · {totalMb.toFixed(1)} MB</p>
              </div>
            ) : (
              <p className="text-neutral-400 text-sm">drop files or click to choose</p>
            )}
          </div>

          {isLarge && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-amber-300/80 text-xs mb-4 text-center">
              large drop — the browser may feel slow while it sends. no hard limit.
            </motion.p>
          )}

          <div className="flex items-center gap-3 mb-6">
            <span className="text-xs text-neutral-500">halo accent</span>
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
            {uploading ? 'settling into the halo…' : 'share the halo'}
          </motion.button>

          <AnimatePresence>
            {error && (
              <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-red-400 text-sm mt-4 text-center">
                {error}
              </motion.p>
            )}
            {results.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6 glass rounded-2xl p-5 space-y-3">
                <p className="text-sm text-neutral-300 text-center mb-2">shared</p>
                {results.map((r) => (
                  <a key={r.id} href={r.embed} target="_blank" rel="noreferrer" className="block text-[#0A84FF] text-sm break-all hover:underline">
                    {r.name}
                  </a>
                ))}
                {results.some((r) => r.warn) && <p className="text-xs text-amber-300/70 mt-2 text-center">some larger drops may have felt slow</p>}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {shares.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-12">
            <h2 className="text-lg font-medium mb-4 text-neutral-300">recent halo shares</h2>
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
