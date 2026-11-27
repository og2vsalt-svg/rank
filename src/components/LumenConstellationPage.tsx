import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from './VaultContext';
import { publishLocalFile, shareUrls, type CloudMeta } from '../lib/cloudShare';
import { useRouter } from './Router';
import Navbar from './Navbar';

export default function LumenConstellationPage() {
  const { addFiles } = useVault();
  const { navigate } = useRouter();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stars, setStars] = useState<{ name: string; id: string; warn?: string; url: string; thumb?: string; size: number; x: number; y: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('lumen constellation');
  const [caption, setCaption] = useState('quiet stars, connected light');
  const [accent, setAccent] = useState('#0A84FF');
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;
    setUploading(true);
    setError(null);
    setStars([]);
    setProgress(0);

    await addFiles(list, 'lumenconstellation');

    const newStars: typeof stars = [];
    const radius = 160;
    const centerX = 50;
    const centerY = 50;

    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      setProgress(Math.round(((i + 0.4) / list.length) * 100));
      let thumb: string | undefined;
      if (file.type.startsWith('image/')) {
        try { thumb = URL.createObjectURL(file); } catch {}
      }
      const angle = (i / Math.max(list.length, 1)) * Math.PI * 2 - Math.PI / 2;
      const x = centerX + Math.cos(angle) * (radius / 4);
      const y = centerY + Math.sin(angle) * (radius / 4);

      try {
        const pub = await publishLocalFile(file, {
          caption: caption || 'Shared from Lumen Constellation',
          cardTitle: title || file.name,
          color: accent,
        });
        if (pub.ok && pub.id) {
          const urls = shareUrls(pub.id);
          newStars.push({
            name: file.name,
            id: pub.id,
            warn: pub.warn || undefined,
            url: urls.embed,
            thumb,
            size: file.size,
            x,
            y,
          });
        } else {
          setError(pub.error || 'upload failed for one file');
        }
      } catch (e: any) {
        setError(e?.message || 'upload error');
      }
      setProgress(Math.round(((i + 1) / list.length) * 100));
    }
    setStars(newStars);
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
          <p className="text-[#0A84FF] text-sm tracking-wide mb-3">lumen constellation</p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight mb-5 leading-[1.02]">stars of light.<br />connected quiet.</h1>
          <p className="text-neutral-400 text-lg max-w-2xl mx-auto leading-relaxed">Shape a shared title, caption, and accent, then drop local files. They settle into a living constellation with Apple-style springs. Each becomes its own permanent Discord-ready link. Soft size warnings only — no hard limits. Prior desks remain untouched.</p>
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
                <p className="text-base text-neutral-300">mapping constellation… {progress}%</p>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden max-w-sm mx-auto">
                  <motion.div className="h-full" style={{ background: accent }} initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ type: 'spring', stiffness: 80, damping: 20 }} />
                </div>
              </motion.div>
            ) : (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center" style={{ background: `${accent}22`, color: accent }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>
                </div>
                <p className="text-2xl font-medium mb-2">Drop files into the constellation</p>
                <p className="text-sm text-neutral-500">or click to browse. Large files may feel slow in the browser — nothing is blocked.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {error && (
          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center text-sm text-red-400 mb-8">{error}</motion.p>
        )}

        <AnimatePresence>
          {stars.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 100, damping: 20 }} className="mb-12">
              <p className="text-sm text-neutral-400 text-center mb-6">each star ships with a polished Discord embed</p>
              <div ref={canvasRef} className="relative h-[480px] glass rounded-3xl overflow-hidden">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {stars.map((star, i) => {
                    const next = stars[(i + 1) % stars.length];
                    return (
                      <motion.line
                        key={`line-${star.id}`}
                        x1={star.x}
                        y1={star.y}
                        x2={next.x}
                        y2={next.y}
                        stroke={accent}
                        strokeWidth="0.3"
                        strokeOpacity="0.4"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ delay: i * 0.08, type: 'spring', stiffness: 60, damping: 20 }}
                      />
                    );
                  })}
                </svg>
                {stars.map((star, i) => (
                  <motion.div
                    key={star.id}
                    initial={{ opacity: 0, scale: 0.4 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.07, type: 'spring', stiffness: 180, damping: 16 }}
                    className="absolute w-16 h-16 -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                    style={{ left: `${star.x}%`, top: `${star.y}%` }}
                    onClick={() => navigator.clipboard.writeText(star.url)}
                  >
                    <div className="w-full h-full rounded-full flex items-center justify-center border-2" style={{ background: `${accent}33`, borderColor: accent }}>
                      {star.thumb ? (
                        <img src={star.thumb} alt="" className="w-10 h-10 object-cover rounded-full" />
                      ) : (
                        <div className="w-3 h-3 rounded-full" style={{ background: accent }} />
                      )}
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition text-xs text-center whitespace-nowrap bg-black/70 px-2 py-1 rounded-lg">
                      {star.name}<br />{prettySize(star.size)}{star.warn ? ` · ${star.warn}` : ''}
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-3 justify-center">
                {stars.map((star) => (
                  <button
                    key={star.id}
                    onClick={() => navigator.clipboard.writeText(star.url)}
                    className="px-4 py-2 rounded-full text-xs font-medium text-white"
                    style={{ background: accent }}
                  >
                    copy {star.name.slice(0, 16)}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-center mt-12">
          <button onClick={() => navigate('home')} className="text-sm text-neutral-500 hover:text-white transition">← back home</button>
        </div>
      </div>
    </div>
  );
}
