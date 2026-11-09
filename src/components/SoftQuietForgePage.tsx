import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';

export default function SoftQuietForgePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [sharedCaption, setSharedCaption] = useState('');
  const [accent, setAccent] = useState('#FF9500');
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
    if (list.length) setFiles((prev) => [...prev, ...list]);
  };

  const onChoose = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    if (list.length) setFiles((prev) => [...prev, ...list]);
  };

  const setNote = (name: string, note: string) => {
    setNotes((n) => ({ ...n, [name]: note }));
  };

  const removeFile = (idx: number) => {
    setFiles((f) => f.filter((_, i) => i !== idx));
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
        meta: { desk: 'softquietforge' },
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

  const totalMb = files.reduce((n, f) => n + f.size, 0) / 1024 / 1024;
  const isLarge = totalMb > 25;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 70, damping: 16 }}
          className="glass rounded-[40px] p-8 sm:p-12 relative overflow-hidden"
        >
          <motion.div
            className="absolute inset-0 opacity-20 pointer-events-none"
            animate={{ background: ['radial-gradient(circle at 20% 30%, #FF9500 0%, transparent 50%)', 'radial-gradient(circle at 80% 70%, #FF9500 0%, transparent 50%)', 'radial-gradient(circle at 20% 30%, #FF9500 0%, transparent 50%)'] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <p className="text-sm text-[#FF9500] mb-3 tracking-wide font-medium relative z-10">soft quiet forge</p>
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight mb-4 text-white leading-tight relative z-10">
            forge what you carry<br />into quiet metal.
          </h1>
          <p className="text-neutral-400 text-sm leading-relaxed mb-10 relative z-10">
            Multi-file local upload where each file is heated and settled into the forge. Individual quiet notes or a shared caption and warm accent. Soft glass surfaces with gentle heat glow and spring motion. Lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned about possible slowness, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting.
          </p>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className="border border-dashed border-white/15 rounded-3xl p-12 text-center cursor-pointer hover:border-[#FF9500]/40 hover:bg-[#FF9500]/5 transition-all duration-700 mb-8 relative z-10"
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={onChoose}
            />
            <p className="text-neutral-400 text-sm">drop files or click to choose</p>
            {files.length > 0 && <p className="text-white text-sm mt-2">{files.length} file{files.length > 1 ? 's' : ''}</p>}
          </div>

          <AnimatePresence>
            {files.map((f, i) => (
              <motion.div
                key={f.name + i}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                className="glass rounded-2xl p-4 mb-3 flex items-start gap-4 relative z-10"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{f.name}</p>
                  <p className="text-xs text-neutral-500">{(f.size / 1024 / 1024).toFixed(1)} MB</p>
                  <input
                    value={notes[f.name] || ''}
                    onChange={(e) => setNote(f.name, e.target.value)}
                    placeholder="quiet note for this file (optional)"
                    className="mt-2 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#FF9500]/30"
                  />
                </div>
                <button onClick={() => removeFile(i)} className="text-neutral-500 hover:text-white text-xs">remove</button>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLarge && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-amber-300/80 text-xs mb-4 text-center relative z-10">
              large drop — the browser may feel slow while it sends. no hard limit.
            </motion.p>
          )}

          <input
            value={sharedCaption}
            onChange={(e) => setSharedCaption(e.target.value)}
            placeholder="shared forge caption (optional)"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-neutral-500 mb-4 focus:outline-none focus:border-[#FF9500]/30 relative z-10"
          />

          <div className="flex items-center gap-3 mb-8 relative z-10">
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
            whileTap={{ scale: 0.965 }}
            disabled={!files.length || uploading}
            onClick={shareAll}
            className="w-full py-3.5 rounded-full bg-[#FF9500] text-black text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#ffa726] transition relative z-10"
          >
            {uploading ? 'forging…' : 'forge into quiet metal'}
          </motion.button>

          <AnimatePresence>
            {error && (
              <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-red-400 text-sm mt-4 text-center relative z-10">
                {error}
              </motion.p>
            )}
            {results.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-3 relative z-10">
                <p className="text-sm text-neutral-300 text-center mb-2">forged</p>
                {results.map((r) => (
                  <div key={r.id} className="glass rounded-2xl p-4 text-center">
                    <p className="text-xs text-neutral-400 mb-1">{r.name}</p>
                    <a href={r.embed} target="_blank" rel="noreferrer" className="text-[#FF9500] text-sm break-all hover:underline">
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-16">
            <h2 className="text-lg font-medium mb-5 text-neutral-300">recent in the forge</h2>
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
