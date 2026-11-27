import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from './VaultContext';
import { publishLocalFile, shareUrls, listPublicShares, type CloudMeta } from '../lib/cloudShare';
import { useRouter } from './Router';
import Navbar from './Navbar';

export default function AetherArchivePage() {
  const { addFiles } = useVault();
  const { navigate } = useRouter();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ name: string; id: string; warn?: string; url: string; thumb?: string; size: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [loadingShares, setLoadingShares] = useState(true);
  const [title, setTitle] = useState('aether archive');
  const [caption, setCaption] = useState('quiet files, living light');
  const [accent, setAccent] = useState('#0A84FF');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let live = true;
    listPublicShares(24).then((rows) => {
      if (live) {
        setShares(rows);
        setLoadingShares(false);
      }
    });
    return () => { live = false; };
  }, []);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;
    setUploading(true);
    setError(null);
    setResults([]);
    setProgress(0);

    await addFiles(list, 'aetherarchive');

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
          caption: caption || 'Shared from Aether Archive',
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
    // refresh gallery
    listPublicShares(24).then(setShares);
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
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 pt-28 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          className="text-center mb-12"
        >
          <p className="text-[#0A84FF] text-sm tracking-wide mb-3">aether archive</p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight mb-5 leading-[1.02]">living files.<br />quiet light.</h1>
          <p className="text-neutral-400 text-lg max-w-2xl mx-auto leading-relaxed">Shape a shared title, caption, and accent, then drop local files. They settle into the archive with staggered Apple-style springs. Each becomes its own permanent Discord-ready link. Soft size warnings only — no hard limits. Prior desks remain untouched.</p>
        </motion.div>

        <div className="glass rounded-3xl p-6 mb-10 grid sm:grid-cols-3 gap-4">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="shared title" className="bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-white/25" />
          <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="caption" className="bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-white/25" />
          <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="h-12 w-full rounded-2xl bg-black/30 border border-white/10 cursor-pointer" />
        </div>

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
                <div className="w-20 h-20 mx-auto rounded-full border-2 border-current/30 border-t-current animate-spin" style={{ color: accent }} />
                <p className="text-base text-neutral-300">archiving files… {progress}%</p>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden max-w-sm mx-auto">
                  <motion.div className="h-full" style={{ background: accent }} initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ type: 'spring', stiffness: 80, damping: 20 }} />
                </div>
              </motion.div>
            ) : (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center" style={{ background: `${accent}22`, color: accent }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 16V4m0 0L8 8m4-4l4 4M4 20h16"/></svg>
                </div>
                <p className="text-2xl font-medium mb-2">Drop files into the archive</p>
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
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 100, damping: 20 }} className="space-y-6 mb-12">
              <p className="text-sm text-neutral-400">each link ships with a polished Discord embed</p>
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
                      style={{ background: accent }}
                    >
                      copy share link
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8">
          <h2 className="text-2xl font-semibold tracking-tight mb-6">recent archive</h2>
          {loadingShares ? (
            <div className="text-sm text-neutral-500">gathering recent light…</div>
          ) : shares.length === 0 ? (
            <p className="text-neutral-500 text-sm">no public shares yet. drop one above.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {shares.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, type: 'spring', stiffness: 120, damping: 18 }}
                  className="glass rounded-2xl p-4 flex flex-col gap-3"
                >
                  {s.type?.startsWith('image/') && s.fileUrl && (
                    <img src={s.fileUrl} alt="" className="w-full h-32 object-cover rounded-xl bg-black/20" loading="lazy" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{s.name || 'untitled'}</p>
                    <p className="text-xs text-neutral-500">{prettySize(s.size || 0)}</p>
                    {s.caption && <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{s.caption}</p>}
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(shareUrls(s.id).embed)}
                    className="mt-auto px-3 py-2 rounded-full bg-white/10 text-xs hover:bg-white/15 transition self-start"
                  >
                    copy link
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="text-center mt-12">
          <button onClick={() => navigate('home')} className="text-sm text-neutral-500 hover:text-white transition">← back home</button>
        </div>
      </div>
    </div>
  );
}
