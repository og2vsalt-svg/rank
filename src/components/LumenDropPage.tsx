import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from './VaultContext';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function LumenDropPage() {
  const { addFiles } = useVault();
  const { navigate } = useRouter();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ name: string; id: string; warn?: string; url: string; thumb?: string; size: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [caption, setCaption] = useState('Shared via Lumen Drop');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;
    setUploading(true);
    setError(null);
    setResults([]);
    setProgress(0);

    await addFiles(list, 'lumendrop');

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
          caption,
          cardTitle: file.name,
          color: '#0A84FF',
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
          });
        } else {
          setError(pub.error || 'one file could not be shared');
        }
      } catch (e: any) {
        setError(e?.message || 'upload interrupted');
      }
      setProgress(Math.round(((i + 1) / list.length) * 100));
    }
    setResults(newResults);
    setUploading(false);
    setProgress(100);
  }, [addFiles, caption]);

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

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7] font-sans antialiased">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          className="text-center mb-12"
        >
          <p className="text-[#0A84FF] text-sm tracking-wide mb-3">lumen drop</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-4 leading-[1.05]">drop anything.<br />share instantly.</h1>
          <p className="text-neutral-400 text-lg max-w-md mx-auto">Multi-file hosting with live previews. Soft size warnings only — no hard limits. Every link ships with a polished Discord embed.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, type: 'spring', stiffness: 120, damping: 22 }}
          className="mb-8 max-w-md mx-auto"
        >
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="optional caption for the embed"
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#0A84FF]/40 transition"
          />
        </motion.div>

        <motion.div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          animate={{
            scale: dragging ? 1.02 : 1,
            borderColor: dragging ? '#0A84FF' : 'rgba(255,255,255,0.08)',
          }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          className="relative border-2 border-dashed rounded-3xl p-14 text-center bg-white/[0.025] backdrop-blur-2xl cursor-pointer"
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
              <motion.div key="uploading" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                <div className="w-16 h-16 mx-auto rounded-full border-2 border-[#0A84FF]/30 border-t-[#0A84FF] animate-spin" />
                <p className="text-sm text-neutral-300">uploading… {progress}%</p>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden max-w-xs mx-auto">
                  <motion.div className="h-full bg-[#0A84FF]" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ type: 'spring', stiffness: 80, damping: 20 }} />
                </div>
              </motion.div>
            ) : (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="w-16 h-16 mx-auto mb-5 rounded-3xl bg-[#0A84FF]/10 flex items-center justify-center text-[#0A84FF]">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M12 16V4m0 0L8 8m4-4l4 4M4 20h16"/></svg>
                </div>
                <p className="text-xl font-medium mb-2">Drop files here</p>
                <p className="text-sm text-neutral-500">or click to browse · soft warnings only for large files</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {error && (
          <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-5 text-center text-sm text-red-400">{error}</motion.p>
        )}

        <AnimatePresence>
          {results.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 100, damping: 20 }} className="mt-12 space-y-3">
              <p className="text-sm text-neutral-400 mb-3">shares ready · Discord embeds are live</p>
              {results.map((r) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.035] border border-white/[0.06] backdrop-blur-xl"
                >
                  {r.thumb ? (
                    <img src={r.thumb} alt="" className="w-14 h-14 rounded-2xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-neutral-500 text-xs flex-shrink-0">file</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{r.name}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{formatSize(r.size)}</p>
                    {r.warn && <p className="text-xs text-amber-400 mt-1">{r.warn}</p>}
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(r.url)}
                    className="px-4 py-1.5 rounded-full bg-[#0A84FF] text-white text-xs font-medium hover:bg-[#3A9DFF] transition"
                  >
                    copy link
                  </button>
                </motion.div>
              ))}
              <div className="pt-4 text-center">
                <button onClick={() => navigate('home')} className="text-sm text-neutral-500 hover:text-white transition">← back to home</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
