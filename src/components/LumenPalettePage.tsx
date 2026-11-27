import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from './VaultContext';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';
import Navbar from './Navbar';

function extractPalette(file: File): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve([]); return; }
      const size = 48;
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;
      const counts: Record<string, number> = {};
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 128) continue;
        const r = Math.round(data[i] / 24) * 24;
        const g = Math.round(data[i + 1] / 24) * 24;
        const b = Math.round(data[i + 2] / 24) * 24;
        const key = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        counts[key] = (counts[key] || 0) + 1;
      }
      const sorted = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 7)
        .map(([c]) => c);
      URL.revokeObjectURL(img.src);
      resolve(sorted);
    };
    img.onerror = () => resolve([]);
    img.src = URL.createObjectURL(file);
  });
}

export default function LumenPalettePage() {
  const { addFiles } = useVault();
  const { navigate } = useRouter();
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<{ name: string; id?: string; url?: string; warn?: string; thumb?: string; palette: string[]; size: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('lumen palette');
  const [caption, setCaption] = useState('quiet colors drawn from light');
  const [accent, setAccent] = useState('#0A84FF');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!list.length) {
      setError('drop an image to read its light');
      return;
    }
    setProcessing(true);
    setError(null);
    setResults([]);
    await addFiles(list, 'lumenpalette');

    const newResults: typeof results = [];
    for (const file of list) {
      let thumb: string | undefined;
      try { thumb = URL.createObjectURL(file); } catch {}
      const palette = await extractPalette(file);
      const paletteText = palette.length ? ` · ${palette.join(' ')}` : '';
      try {
        const pub = await publishLocalFile(file, {
          caption: (caption || 'colors from Lumen Palette') + paletteText,
          cardTitle: title || file.name,
          color: accent,
          meta: { palette },
        });
        if (pub.ok && pub.id) {
          const urls = shareUrls(pub.id);
          newResults.push({
            name: file.name,
            id: pub.id,
            warn: pub.warn || undefined,
            url: urls.embed,
            thumb,
            palette,
            size: file.size,
          });
        } else {
          setError(pub.error || 'could not publish one image');
        }
      } catch (e: any) {
        setError(e?.message || 'publish error');
      }
    }
    setResults(newResults);
    setProcessing(false);
  }, [addFiles, title, caption, accent]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

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
          <p className="text-[#0A84FF] text-sm tracking-wide mb-3">lumen palette</p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight mb-5 leading-[1.02]">colors from light.<br />quiet shares.</h1>
          <p className="text-neutral-400 text-lg max-w-2xl mx-auto leading-relaxed">Drop local images. A living palette settles with Apple-style springs. Publish each as its own permanent Discord-ready link, with the colors carried in the caption. Soft size warnings only — no hard limits. Prior desks remain untouched.</p>
        </motion.div>

        <div className="glass rounded-3xl p-6 mb-10 grid sm:grid-cols-3 gap-4">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="shared title" className="bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-white/25" />
          <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="caption" className="bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-white/25" />
          <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="h-12 w-full rounded-2xl bg-black/30 border border-white/10 cursor-pointer" />
        </div>

        <motion.div
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
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
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
          <AnimatePresence mode="wait">
            {processing ? (
              <motion.div key="processing" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="w-20 h-20 mx-auto rounded-full border-2 border-current/30 border-t-current animate-spin" style={{ color: accent }} />
                <p className="text-base text-neutral-300">reading light…</p>
              </motion.div>
            ) : (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center" style={{ background: `${accent}22`, color: accent }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                </div>
                <p className="text-2xl font-medium mb-2">Drop images for a palette</p>
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
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 100, damping: 20 }} className="space-y-8 mb-12">
              <p className="text-sm text-neutral-400">each link ships with a polished Discord embed</p>
              {results.map((r, i) => (
                <motion.div
                  key={r.id || i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, type: 'spring', stiffness: 140, damping: 18 }}
                  className="glass rounded-3xl p-6 flex flex-col md:flex-row gap-6"
                >
                  {r.thumb && (
                    <img src={r.thumb} alt="" className="w-full md:w-48 h-40 object-cover rounded-2xl" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium truncate mb-1">{r.name}</p>
                    <p className="text-xs text-neutral-500 mb-4">{prettySize(r.size)}{r.warn && <span className="text-amber-400 ml-2">{r.warn}</span>}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {r.palette.map((c, j) => (
                        <motion.button
                          key={c}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: i * 0.06 + j * 0.04, type: 'spring', stiffness: 200, damping: 16 }}
                          onClick={() => navigator.clipboard.writeText(c)}
                          className="group relative w-12 h-12 rounded-2xl shadow-lg"
                          style={{ background: c }}
                          title={c}
                        >
                          <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-neutral-400 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">{c}</span>
                        </motion.button>
                      ))}
                    </div>
                    {r.url && (
                      <button
                        onClick={() => navigator.clipboard.writeText(r.url!)}
                        className="px-5 py-2.5 rounded-full text-white text-xs font-medium transition"
                        style={{ background: accent }}
                      >
                        copy share link
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
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
