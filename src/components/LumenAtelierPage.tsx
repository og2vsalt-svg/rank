import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from './VaultContext';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function LumenAtelierPage() {
  const { addFiles } = useVault();
  const { navigate } = useRouter();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ name: string; id: string; warn?: string; url: string; thumb?: string; size: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('quiet atelier');
  const [caption, setCaption] = useState('shared from Lumen Atelier');
  const [accent, setAccent] = useState('#0A84FF');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;
    setUploading(true);
    setError(null);
    setResults([]);
    setProgress(0);

    await addFiles(list, 'lumenatelier');

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
          cardTitle: title || file.name,
          color: accent,
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
  }, [addFiles, title, caption, accent]);

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
          className="text-center mb-14"
        >
          <p className="text-[#0A84FF] text-sm tracking-wide mb-3">lumen atelier</p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight mb-5 leading-[1.02]">shape the light.<br />share the work.</h1>
          <p className="text-neutral-400 text-lg max-w-2xl mx-auto leading-relaxed">Craft a quiet title, caption, and accent, then drop local files. Each settles with Apple-style springs into a permanent Discord-ready link. Soft size warnings only — no hard limits, no boosting. Frosted glass throughout.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.1 }}
          className="glass rounded-3xl p-8 mb-10 max-w-2xl mx-auto"
        >
          <div className="grid sm:grid-cols-2 gap-5">
            <label className="block text-sm">
              <span className="text-neutral-400">title</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-[#0A84FF]/50 transition"
                placeholder="quiet atelier"
              />
            </label>
            <label className="block text-sm">
              <span className="text-neutral-400">accent</span>
              <div className="mt-1.5 flex items-center gap-3">
                <input
                  type="color"
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  className="w-12 h-12 rounded-xl border border-white/10 bg-transparent cursor-pointer"
                />
                <input
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm"
                />
              </div>
            </label>
          </div>
          <label className="block text-sm mt-5">
            <span className="text-neutral-400">caption</span>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={2}
              className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-[#0A84FF]/50 transition resize-none"
              placeholder="shared from Lumen Atelier"
            />
          </label>
        </motion.div>

        <motion.div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          animate={{
            scale: dragging ? 1.015 : 1,
            borderColor: dragging ? accent : 'rgba(255,255,255,0.08)',
          }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          className="relative border-2 border-dashed rounded-3xl p-20 text-center bg-white/[0.025] backdrop-blur-2xl cursor-pointer mb-12"
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
                <div className="w-20 h-20 mx-auto rounded-full border-2 border-white/20" style={{ borderTopColor: accent }} className="animate-spin" />
                <p className="text-base text-neutral-300">atelier settling… {progress}%</p>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden max-w-sm mx-auto">
                  <motion.div className="h-full" style={{ backgroundColor: accent }} initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ type: 'spring', stiffness: 80, damping: 20 }} />
                </div>
              </motion.div>
            ) : (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center" style={{ backgroundColor: `${accent}22`, color: accent }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 16V4m0 0L8 8m4-4l4 4M4 20h16"/></svg>
                </div>
                <p className="text-2xl font-medium mb-2">Drop files into the atelier</p>
                <p className="text-sm text-neutral-500">or click to browse. Large files may feel slow in the browser — nothing is blocked.</p>
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
              <p className="text-sm text-neutral-400">each link ships with a polished Discord embed in your accent</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {results.map((r, i) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, type: 'spring', stiffness: 140, damping: 18 }}
                    className="glass rounded-2xl p-5 flex flex-col gap-4"
                  >
                    {r.thumb && (
                      <img src={r.thumb} alt="" className="w-full h-36 object-cover rounded-xl" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{r.name}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{prettySize(r.size)}</p>
                      {r.warn && <p className="text-xs text-amber-400 mt-1">{r.warn}</p>}
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(r.url)}
                      className="mt-auto px-4 py-2.5 rounded-full text-white text-xs font-medium transition self-start"
                      style={{ backgroundColor: accent }}
                    >
                      copy share link
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
