import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function QuietMosaicPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<{ link?: string; error?: string; name: string }[]>([]);
  const [warn, setWarn] = useState<string | null>(null);

  const onDrop = useCallback((e: React.DragEvent | React.ChangeEvent<HTMLInputElement>) => {
    const list = 'dataTransfer' in e ? Array.from(e.dataTransfer.files) : Array.from((e.target as HTMLInputElement).files || []);
    const images = list.filter(f => f.type.startsWith('image/'));
    if (!images.length) return;
    const totalSize = images.reduce((s, f) => s + f.size, 0);
    setWarn(totalSize > 40 * 1024 * 1024 ? 'Large mosaic — may feel slow to send. No hard limits.' : null);
    setFiles(prev => [...prev, ...images]);
    images.forEach(f => {
      const url = URL.createObjectURL(f);
      setPreviews(prev => [...prev, url]);
    });
  }, []);

  const remove = (i: number) => {
    URL.revokeObjectURL(previews[i]);
    setFiles(f => f.filter((_, idx) => idx !== i));
    setPreviews(p => p.filter((_, idx) => idx !== i));
  };

  const publish = async () => {
    if (!files.length || busy) return;
    setBusy(true);
    setResults([]);
    const outs: typeof results = [];
    for (const file of files) {
      const res = await publishLocalFile(file, {
        caption: caption.trim() || 'Quiet Mosaic',
        color: accent,
        cardTitle: caption.trim() || file.name,
        meta: { desk: 'quietmosaic' },
      });
      outs.push({
        name: file.name,
        link: res.embed,
        error: res.error,
      });
    }
    setResults(outs);
    setBusy(false);
  };

  const clear = () => {
    previews.forEach(URL.revokeObjectURL);
    setFiles([]);
    setPreviews([]);
    setResults([]);
    setWarn(null);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 22 }}
          className="glass rounded-[36px] p-8 md:p-12"
        >
          <p className="text-[13px] font-medium tracking-wide mb-2" style={{ color: accent }}>Quiet Mosaic</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">Compose a quiet mosaic.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Drop several images. They settle into the database as individual shares with polished Discord embeds on every link. Soft size warnings only — never hard limits. Apple-style springs on frosted glass.
          </p>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onDrop(e); }}
            className="border-2 border-dashed border-white/20 rounded-3xl p-12 text-center mb-8 hover:border-white/40 transition cursor-pointer"
            onClick={() => document.getElementById('mosaic-input')?.click()}
          >
            <p className="text-neutral-400">Drop images or click to choose</p>
            <input id="mosaic-input" type="file" multiple accept="image/*" className="hidden" onChange={onDrop} />
          </div>

          {previews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
              <AnimatePresence>
                {previews.map((src, i) => (
                  <motion.div
                    key={src}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className="relative aspect-square rounded-2xl overflow-hidden group"
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => remove(i)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white text-xs opacity-0 group-hover:opacity-100 transition"
                    >
                      ×
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Shared caption for the mosaic"
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition"
          />

          <div className="flex items-center gap-3 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-500">Accent for the embeds</span>
          </div>

          {warn && <p className="text-[13px] text-amber-300/80 mb-5">{warn}</p>}

          <AnimatePresence>
            {results.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mb-5 space-y-2">
                {results.map((r, i) => (
                  <div key={i} className="text-sm">
                    <span className="text-neutral-400">{r.name}: </span>
                    {r.link ? (
                      <a href={r.link} target="_blank" rel="noreferrer" className="text-blue-400 break-all">{r.link}</a>
                    ) : (
                      <span className="text-red-400">{r.error}</span>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-3">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={publish}
              disabled={!files.length || busy}
              className="flex-1 rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl"
              style={{ background: accent }}
            >
              {busy ? 'Publishing…' : `Publish ${files.length} image${files.length === 1 ? '' : 's'}`}
            </motion.button>
            {files.length > 0 && (
              <button onClick={clear} className="px-5 rounded-2xl text-sm text-neutral-400 hover:text-white">clear</button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
