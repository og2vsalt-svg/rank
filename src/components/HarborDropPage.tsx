import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from './VaultContext';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function HarborDropPage() {
  const { addFiles } = useVault();
  const { navigate } = useRouter();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ name: string; id: string; warn?: string; url: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;
    setUploading(true);
    setError(null);
    setResults([]);
    setProgress(0);

    const localRes = await addFiles(list, 'harbor');
    if (localRes.warn) {
      // soft warning shown in UI
    }

    const newResults: typeof results = [];
    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      setProgress(Math.round(((i + 0.3) / list.length) * 100));
      try {
        const pub = await publishLocalFile(file, {
          caption: 'Shared from Harbor Drop',
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
          });
        } else {
          setError(pub.error || 'upload failed for one file');
        }
      } catch (e: any) {
        setError(e?.message || 'upload error');
      }
      setProgress(Math.round(((i + 1) / list.length) * 100));
    }
    setResults(newResults);
    setUploading(false);
    setProgress(100);
  }, [addFiles]);

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

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7] font-sans antialiased">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="text-center mb-12"
        >
          <p className="text-[#0A84FF] text-sm tracking-wide mb-3">harbor drop</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-4">drop anything.<br />share instantly.</h1>
          <p className="text-neutral-400 text-lg max-w-md mx-auto">Multi-file hosting with live progress. Soft size warnings only. Every link ships with a polished Discord embed.</p>
        </motion.div>

        <motion.div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          animate={{
            scale: dragging ? 1.02 : 1,
            borderColor: dragging ? '#0A84FF' : 'rgba(255,255,255,0.08)',
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative border-2 border-dashed rounded-3xl p-12 text-center bg-white/[0.02] backdrop-blur-xl cursor-pointer"
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
              <motion.div
                key="uploading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="w-16 h-16 mx-auto rounded-full border-2 border-[#0A84FF]/30 border-t-[#0A84FF] animate-spin" />
                <p className="text-sm text-neutral-300">uploading… {progress}%</p>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden max-w-xs mx-auto">
                  <motion.div
                    className="h-full bg-[#0A84FF]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ type: 'spring', stiffness: 100 }}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#0A84FF]/10 flex items-center justify-center text-[#0A84FF]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 16V4m0 0L8 8m4-4l4 4M4 20h16"/></svg>
                </div>
                <p className="text-lg font-medium mb-1">Drop files or click to browse</p>
                <p className="text-sm text-neutral-500">No hard limits. Large files may feel slow in the browser.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-center text-sm text-red-400">{error}</motion.p>
        )}

        <AnimatePresence>
          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-10 space-y-3"
            >
              <p className="text-sm text-neutral-400 mb-2">ready to share — Discord embeds active</p>
              {results.map((r) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{r.name}</p>
                    {r.warn && <p className="text-xs text-amber-400 mt-0.5">{r.warn}</p>}
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(r.url);
                      // subtle feedback could be added
                    }}
                    className="ml-4 px-4 py-1.5 rounded-full bg-[#0A84FF] text-white text-xs font-medium hover:bg-[#3A9DFF] transition"
                  >
                    copy link
                  </button>
                </motion.div>
              ))}
              <button
                onClick={() => navigate('home')}
                className="mt-4 text-sm text-neutral-500 hover:text-white transition"
              >
                ← back home
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
