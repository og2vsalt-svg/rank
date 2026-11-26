import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from './VaultContext';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function AetherStreamPage() {
  const { addFiles } = useVault();
  const { navigate } = useRouter();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ name: string; id: string; warn?: string; url: string; thumb?: string; size: number; step: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('Aether Stream');
  const [caption, setCaption] = useState('A quiet sequence');
  const [accent, setAccent] = useState('#5AC8FA');
  const [stepNote, setStepNote] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;
    setUploading(true);
    setError(null);
    setProgress(0);

    await addFiles(list, 'aetherstream');

    const newResults: typeof results = [];
    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      setProgress(Math.round(((i + 0.4) / list.length) * 100));
      let thumb: string | undefined;
      if (file.type.startsWith('image/')) {
        try { thumb = URL.createObjectURL(file); } catch {}
      }
      try {
        const pub = await publishLocalFile(file, {
          caption: stepNote || caption,
          cardTitle: `${title} — step ${i + 1}`,
          color: accent,
          meta: { desk: 'aetherstream', step: i + 1, note: stepNote },
        });
        if (pub.ok && pub.id) {
          const urls = shareUrls(pub.id);
          newResults.push({
            name: file.name,
            id: pub.id,
            warn: pub.warn || undefined,
            url: urls.embed,
            thumb,
            size: file.size,
            step: i + 1,
          });
        } else {
          setError(pub.error || 'upload failed for one file');
        }
      } catch (e: any) {
        setError(e?.message || 'upload error');
      }
      setProgress(Math.round(((i + 1) / list.length) * 100));
    }
    setResults((prev) => [...prev, ...newResults]);
    setUploading(false);
    setProgress(100);
    setStepNote('');
  }, [addFiles, title, caption, accent, stepNote]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setDragging(false), []);

  const prettySize = (n: number) => {
    if (n < 1024) return n + ' B';
    if (n < 1048576) return Math.round(n / 1024) + ' KB';
    return (n / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7] font-sans antialiased">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          className="text-center mb-12"
        >
          <p className="text-sm tracking-wide mb-3" style={{ color: accent }}>aether stream</p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight mb-5 leading-[1.02]">a living sequence<br />of shared moments.</h1>
          <p className="text-neutral-400 text-lg max-w-2xl mx-auto leading-relaxed">Add steps one by one. Drop a file (or several), optionally note the moment, then continue. Each becomes a permanent Discord-ready link. Soft size warnings only. Apple-style springs on frosted glass. Prior desks stay intact.</p>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="stream title"
            className="glass rounded-2xl px-4 py-3 text-sm bg-white/[0.03] border border-white/10 focus:border-white/30 outline-none transition"
          />
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="base caption"
            className="glass rounded-2xl px-4 py-3 text-sm bg-white/[0.03] border border-white/10 focus:border-white/30 outline-none transition"
          />
          <div className="flex items-center gap-3 glass rounded-2xl px-4 py-3 border border-white/10">
            <span className="text-xs text-neutral-500">accent</span>
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="w-8 h-8 rounded-full border-0 cursor-pointer bg-transparent"
            />
          </div>
        </div>

        <input
          value={stepNote}
          onChange={(e) => setStepNote(e.target.value)}
          placeholder="optional note for the next step…"
          className="w-full max-w-2xl mx-auto block mb-6 glass rounded-2xl px-4 py-3 text-sm bg-white/[0.03] border border-white/10 focus:border-white/30 outline-none transition"
        />

        <motion.div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          animate={{
            scale: dragging ? 1.015 : 1,
            borderColor: dragging ? accent : 'rgba(255,255,255,0.08)',
          }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          className="relative border-2 border-dashed rounded-3xl p-16 text-center bg-white/[0.025] backdrop-blur-2xl cursor-pointer mb-12"
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
          <AnimatePresence mode="wait">
            {uploading ? (
              <motion.div key="uploading" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="w-16 h-16 mx-auto rounded-full border-2 border-white/20 animate-spin" style={{ borderTopColor: accent }} />
                <p className="text-base text-neutral-300">streaming… {progress}%</p>
              </motion.div>
            ) : (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="w-16 h-16 mx-auto mb-5 rounded-3xl flex items-center justify-center" style={{ backgroundColor: `${accent}22`, color: accent }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 16V4m0 0L8 8m4-4l4 4M4 20h16"/></svg>
                </div>
                <p className="text-xl font-medium mb-1">Drop next step</p>
                <p className="text-sm text-neutral-500">or click to browse. Large files may feel slow — nothing is blocked.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {error && (
          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center text-sm text-red-400 mb-8">{error}</motion.p>
        )}

        <AnimatePresence>
          {results.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 100, damping: 20 }} className="space-y-6">
              <p className="text-sm text-neutral-400">stream so far — each link ships with a polished Discord embed</p>
              <div className="space-y-4">
                {results.map((r, i) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, type: 'spring', stiffness: 140, damping: 18 }}
                    className="glass rounded-2xl p-5 flex items-center gap-5"
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium text-white shrink-0" style={{ backgroundColor: accent }}>
                      {r.step}
                    </div>
                    {r.thumb && (
                      <img src={r.thumb} alt="" className="w-16 h-16 object-cover rounded-xl shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{r.name}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{prettySize(r.size)}</p>
                      {r.warn && <p className="text-xs text-amber-400 mt-1">{r.warn}</p>}
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(r.url)}
                      className="px-4 py-2 rounded-full text-white text-xs font-medium transition shrink-0"
                      style={{ backgroundColor: accent }}
                    >
                      copy
                    </button>
                  </motion.div>
                ))}
              </div>
              <button onClick={() => navigate('home')} className="mt-8 text-sm text-neutral-500 hover:text-white transition">← back home</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
