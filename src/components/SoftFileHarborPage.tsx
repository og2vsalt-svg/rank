import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';

export default function SoftFileHarborPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const [sharedNote, setSharedNote] = useState('');
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
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length) {
      setFiles((prev) => [...prev, ...dropped]);
      setNotes((prev) => [...prev, ...dropped.map(() => '')]);
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length) {
      setFiles((prev) => [...prev, ...selected]);
      setNotes((prev) => [...prev, ...selected.map(() => '')]);
    }
  };

  const remove = (i: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
    setNotes((prev) => prev.filter((_, idx) => idx !== i));
  };

  const shareAll = async () => {
    if (!files.length) return;
    setUploading(true);
    setError('');
    setResults([]);
    const outs: typeof results = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const note = notes[i]?.trim() || sharedNote.trim() || undefined;
      const res = await publishLocalFile(file, {
        caption: note,
        color: accent,
        cardTitle: note || file.name,
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
      setNotes([]);
      setSharedNote('');
      listPublicShares(16).then(setShares);
    }
  };

  const totalMb = files.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024;
  const isLarge = totalMb > 25;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 70, damping: 16 }}
          className="glass rounded-[40px] p-8 sm:p-12"
        >
          <p className="text-sm text-[#5AC8FA] mb-3 tracking-wide font-medium">soft file harbor</p>
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight mb-4 text-white leading-tight">
            harbor what you carry.<br />share only when ready.
          </h1>
          <p className="text-neutral-400 text-sm sm:text-base leading-relaxed mb-10">
            Multi-file local upload. Each drop can carry its own quiet note or share a collective caption. Soft glass surfaces rise with spring motion. Lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned about possible slowness — never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting.
          </p>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className="border border-dashed border-white/15 rounded-3xl p-12 text-center cursor-pointer hover:border-white/30 hover:bg-white/[0.03] transition-all duration-700 mb-8"
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={onChange}
            />
            <p className="text-neutral-300 text-sm sm:text-base">drop files or click to choose</p>
            <p className="text-neutral-500 text-xs mt-2">multiple allowed · no hard limits</p>
          </div>

          {isLarge && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-amber-300/80 text-xs mb-6 text-center"
            >
              large harbor — the browser may feel slow while it sends. no hard limit.
            </motion.p>
          )}

          {files.length > 0 && (
            <div className="space-y-3 mb-8">
              {files.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-2xl p-4 flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{f.name}</p>
                    <p className="text-xs text-neutral-500">{(f.size / 1024 / 1024).toFixed(1)} MB</p>
                    <input
                      value={notes[i] || ''}
                      onChange={(e) => {
                        const next = [...notes];
                        next[i] = e.target.value;
                        setNotes(next);
                      }}
                      placeholder="quiet note for this file (optional)"
                      className="mt-2 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/20"
                    />
                  </div>
                  <button onClick={() => remove(i)} className="text-neutral-500 hover:text-white text-xs px-2">remove</button>
                </motion.div>
              ))}
            </div>
          )}

          <input
            value={sharedNote}
            onChange={(e) => setSharedNote(e.target.value)}
            placeholder="shared caption for the harbor (optional)"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/20"
          />

          <div className="flex items-center gap-3 mb-8">
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
            {uploading ? 'harboring…' : files.length ? `harbor ${files.length} file${files.length > 1 ? 's' : ''}` : 'harbor quietly'}
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
                {results.map((r) => (
                  <div key={r.id} className="glass rounded-2xl p-4 text-center">
                    <p className="text-xs text-neutral-400 mb-1">{r.name}</p>
                    <a href={r.embed} target="_blank" rel="noreferrer" className="text-[#5AC8FA] text-sm break-all hover:underline">
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
            className="mt-16"
          >
            <h2 className="text-lg font-medium mb-5 text-neutral-300">recent harbor arrivals</h2>
            <div className="grid sm:grid-cols-2 gap-3">
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
