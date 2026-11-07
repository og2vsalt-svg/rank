import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';

export default function QuietImageAtlasPage() {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#5AC8FA');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ embed: string; warn?: string | null } | null>(null);
  const [error, setError] = useState('');
  const [images, setImages] = useState<CloudMeta[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listPublicShares(30).then((list) =>
      setImages(list.filter((s) => /^image\//.test(s.type)).slice(0, 18))
    );
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) setFile(f);
  };

  const share = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    setResult(null);
    const res = await publishLocalFile(file, {
      caption: caption.trim() || undefined,
      color: accent,
      cardTitle: caption.trim() || file.name,
    });
    setUploading(false);
    if (res.ok && res.embed) {
      setResult({ embed: res.embed, warn: res.warn });
      setFile(null);
      setCaption('');
      listPublicShares(30).then((list) =>
        setImages(list.filter((s) => /^image\//.test(s.type)).slice(0, 18))
      );
    } else {
      setError(res.error || 'could not share');
    }
  };

  const sizeMb = file ? (file.size / 1024 / 1024).toFixed(1) : '0';
  const isLarge = file && file.size > 25 * 1024 * 1024;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 85, damping: 18 }}
          className="glass rounded-[36px] p-8 sm:p-10 mb-10"
        >
          <p className="text-sm text-[#5AC8FA] mb-3 tracking-wide font-medium">quiet image atlas</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3 text-white">
            map what you see.
          </h1>
          <p className="text-neutral-400 text-sm leading-relaxed mb-8">
            Drop local images. They settle into a quiet atlas with spring motion. Lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned about possible slowness — never refused. All prior desks remain fully intact.
          </p>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className="border border-dashed border-white/15 rounded-3xl p-12 text-center cursor-pointer hover:border-white/30 hover:bg-white/[0.03] transition-all duration-500 mb-6"
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {file ? (
              <div>
                <p className="text-white font-medium truncate">{file.name}</p>
                <p className="text-neutral-500 text-sm mt-1">{sizeMb} MB · image</p>
              </div>
            ) : (
              <p className="text-neutral-400 text-sm">drop an image or click to choose</p>
            )}
          </div>

          {isLarge && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-amber-300/80 text-xs mb-4 text-center">
              large image — the browser may feel slow while it sends. no hard limit.
            </motion.p>
          )}

          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="quiet caption (optional)"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-neutral-500 mb-4 focus:outline-none focus:border-white/20"
          />

          <div className="flex items-center gap-3 mb-6">
            <span className="text-xs text-neutral-500">accent</span>
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full border border-white/20 cursor-pointer bg-transparent" />
            <span className="text-xs text-neutral-400">{accent}</span>
          </div>

          <motion.button
            whileTap={{ scale: 0.96 }}
            disabled={!file || uploading}
            onClick={share}
            className="w-full py-3.5 rounded-full bg-[#5AC8FA] text-black text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#6ed0fb] transition"
          >
            {uploading ? 'mapping…' : 'add to atlas'}
          </motion.button>

          <AnimatePresence>
            {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm mt-4 text-center">{error}</motion.p>}
            {result && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6 glass rounded-2xl p-5 text-center">
                <p className="text-sm text-neutral-300 mb-2">mapped</p>
                <a href={result.embed} target="_blank" rel="noreferrer" className="text-[#5AC8FA] text-sm break-all hover:underline">{result.embed}</a>
                {result.warn && <p className="text-xs text-amber-300/70 mt-2">{result.warn}</p>}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {images.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <h2 className="text-lg font-medium mb-4 text-neutral-300">recent atlas light</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {images.map((img, i) => (
                <motion.a
                  key={img.id}
                  href={shareUrls(img.id).app}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04, type: 'spring', stiffness: 120, damping: 16 }}
                  className="glass rounded-3xl overflow-hidden block hover:bg-white/[0.06] transition-all duration-500 aspect-square"
                >
                  {img.url && /^https?:\/\//.test(img.url) ? (
                    <img src={img.url} alt={img.name || ''} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-neutral-500 text-xs">image</div>
                  )}
                  {img.caption && <div className="absolute bottom-0 inset-x-0 p-3 bg-black/40 backdrop-blur-sm text-xs text-white truncate">{img.caption}</div>}
                </motion.a>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
