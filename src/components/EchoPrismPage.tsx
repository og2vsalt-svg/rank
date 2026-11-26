import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from './VaultContext';
import { publishLocalFile, shareUrls, listPublicShares } from '../lib/cloudShare';
import { useRouter } from './Router';

const ACCENTS = [
  { name: 'Apple Blue', hex: '#0A84FF' },
  { name: 'Violet', hex: '#AF52DE' },
  { name: 'Green', hex: '#30D158' },
  { name: 'Orange', hex: '#FF9F0A' },
  { name: 'Pink', hex: '#FF375F' },
  { name: 'Teal', hex: '#64D2FF' },
];

export default function EchoPrismPage() {
  const { addFiles } = useVault();
  const { navigate } = useRouter();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ name: string; id: string; warn?: string; url: string; thumb?: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('Shared from Echo Prism');
  const [caption, setCaption] = useState('Quiet multi-file hosting. Soft warnings only. Polished Discord embeds.');
  const [accent, setAccent] = useState('#0A84FF');
  const [recent, setRecent] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listPublicShares(8).then(setRecent).catch(() => {});
  }, []);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;
    setUploading(true);
    setError(null);
    setResults([]);
    setProgress(0);

    await addFiles(list, 'echoprism');

    const newResults: typeof results = [];
    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      setProgress(Math.round(((i + 0.3) / list.length) * 100));
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
    listPublicShares(8).then(setRecent).catch(() => {});
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

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7] font-sans antialiased">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="text-center mb-10"
        >
          <p className="text-[#0A84FF] text-sm tracking-wide mb-3">echo prism</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-4">quiet echo.<br />drop and share.</h1>
          <p className="text-neutral-400 text-lg max-w-lg mx-auto">Refined multi-file hosting with living previews. Soft size warnings only — no hard limits. Every share link ships with polished Discord embeds. Apple-style springs on frosted glass.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 120, damping: 22 }}
          className="mb-8 space-y-4 max-w-md mx-auto"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="embed title"
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#0A84FF]/50 transition"
          />
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="embed caption"
            rows={2}
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#0A84FF]/50 transition resize-none"
          />
          <div className="flex flex-wrap gap-2 justify-center">
            {ACCENTS.map((a) => (
              <button
                key={a.hex}
                onClick={() => setAccent(a.hex)}
                className={`w-8 h-8 rounded-full border-2 transition ${accent === a.hex ? 'border-white scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: a.hex }}
                title={a.name}
              />
            ))}
          </div>
        </motion.div>

        <motion.div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          animate={{
            scale: dragging ? 1.015 : 1,
            borderColor: dragging ? accent : 'rgba(255,255,255,0.08)',
          }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          className="relative border-2 border-dashed rounded-3xl p-12 text-center bg-white/[0.02] backdrop-blur-xl cursor-pointer mb-12"
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
              <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full border-2 border-current/30 border-t-current animate-spin" style={{ color: accent }} />
                <p className="text-sm text-neutral-300">echo… {progress}%</p>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden max-w-xs mx-auto">
                  <motion.div className="h-full" style={{ backgroundColor: accent }} initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ type: 'spring', stiffness: 100 }} />
                </div>
              </motion.div>
            ) : (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: accent + '20', color: accent }}>
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
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-10 space-y-3">
              <p className="text-sm text-neutral-400 mb-2">ready — Discord embeds use your title, caption & accent</p>
              {results.map((r) => (
                <motion.div key={r.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                  {r.thumb && <img src={r.thumb} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{r.name}</p>
                    {r.warn && <p className="text-xs text-amber-400 mt-0.5">{r.warn}</p>}
                  </div>
                  <button onClick={() => navigator.clipboard.writeText(r.url)} className="px-4 py-1.5 rounded-full text-white text-xs font-medium transition" style={{ backgroundColor: accent }}>copy link</button>
                </motion.div>
              ))}
              <button onClick={() => navigate('home')} className="mt-4 text-sm text-neutral-500 hover:text-white transition">← back home</button>
            </motion.div>
          )}
        </AnimatePresence>

        {recent.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-16"
          >
            <h2 className="text-xl font-semibold mb-6 tracking-tight">recent echo</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {recent.map((s) => (
                <motion.a
                  key={s.id}
                  href={`/s/${s.id}`}
                  whileHover={{ y: -2 }}
                  className="block rounded-2xl bg-white/[0.03] border border-white/5 overflow-hidden"
                >
                  {String(s.type || '').startsWith('image/') && s.fileUrl ? (
                    <img src={s.fileUrl} alt="" className="w-full h-28 object-cover" />
                  ) : (
                    <div className="w-full h-28 bg-white/5 flex items-center justify-center text-neutral-600 text-xs">file</div>
                  )}
                  <div className="p-3">
                    <p className="text-sm truncate">{s.name}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{(s.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                </motion.a>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
