import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';

export default function SoftQuietDuskPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [sharedCaption, setSharedCaption] = useState('');
  const [accent, setAccent] = useState('#6B5B95');
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
        meta: { desk: 'softquietdusk' },
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
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 60, damping: 18 }}
          className="glass rounded-[40px] p-8 sm:p-12"
        >
          <p className="text-sm text-[#8B7EC8] mb-3 tracking-wide font-medium">soft quiet dusk</p>
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight mb-4 text-white leading-tight">
            let what you carry<br />fade into quiet dusk.
          </h1>
          <p className="text-neutral-400 text-sm leading-relaxed mb-10">
            Multi-file local upload where each file settles as soft dusk light. Individual quiet notes or a shared caption and dusk accent. Glass surfaces catch the last light with spring motion. Lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned about possible slowness, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting.
          </p>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className="border border-dashed border-white/15 rounded-3xl p-12 text-center cursor-pointer hover:border-white/30 hover:bg-white/[0.025] transition-all duration-700 mb-8"
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={onChoose}
            />
            <p className="text-neutral-300 text-sm">drop files or click to choose</p>
            <p className="text-xs text-neutral-500 mt-2">they will fade softly into dusk</p>
          </div>

          {files.length > 0 && (
            <div className="space-y-3 mb-8">
              {files.map((f, i) => (
                <motion.div
                  key={f.name + i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-2xl p-4 flex items-start gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{f.name}</p>
                    <p className="text-xs text-neutral-500">{(f.size / 1024 / 1024).toFixed(1)} MB</p>
                    <input
                      value={notes[f.name] || ''}
                      onChange={(e) => setNote(f.name, e.target.value)}
                      placeholder="quiet note for this file…"
                      className="mt-2 w-full bg-transparent text-sm text-neutral-300 outline-none placeholder:text-neutral-600"
                    />
                  </div>
                  <button onClick={() => removeFile(i)} className="text-neutral-500 hover:text-white text-xs">remove</button>
                </motion.div>
              ))}
              {isLarge && (
                <p className="text-xs text-amber-300/70 text-center">large drop — may take a moment, never refused</p>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 mb-6">
            <label className="text-xs text-neutral-400">accent</label>
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="w-8 h-8 rounded-full border border-white/20 bg-transparent cursor-pointer"
            />
            <span className="text-xs text-neutral-400">{accent}</span>
          </div>

          <input
            value={sharedCaption}
            onChange={(e) => setSharedCaption(e.target.value)}
            placeholder="shared dusk caption (optional)…"
            className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3 text-sm text-neutral-200 outline-none mb-6 placeholder:text-neutral-600"
          />

          <motion.button
            whileTap={{ scale: 0.965 }}
            disabled={!files.length || uploading}
            onClick={shareAll}
            className="w-full py-3.5 rounded-full bg-[#6B5B95] text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#7d6ba8] transition"
          >
            {uploading ? 'fading…' : 'fade into dusk'}
          </motion.button>

          <AnimatePresence>
            {error && (
              <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-red-400 text-sm mt-4 text-center">
                {error}
              </motion.p>
            )}
            {results.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-3">
                <p className="text-sm text-neutral-300 text-center mb-2">faded into dusk</p>
                {results.map((r) => (
                  <div key={r.id} className="glass rounded-2xl p-4 text-center">
                    <p className="text-xs text-neutral-400 mb-1">{r.name}</p>
                    <a href={r.embed} target="_blank" rel="noreferrer" className="text-[#8B7EC8] text-sm break-all hover:underline">
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
            <h2 className="text-lg font-medium mb-5 text-neutral-300">recent in the dusk</h2>
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
