import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function LumenMosaicPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [links, setLinks] = useState<string[]>([]);
  const [warns, setWarns] = useState<string[]>([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    const urls = files.map(f => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach(URL.revokeObjectURL);
  }, [files]);

  const onFiles = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list).filter(f => f.type.startsWith('image/'));
    setFiles(prev => [...prev, ...arr]);
    const newWarns = arr.map(f => f.size > 40 * 1024 * 1024 ? 'Large image. Mosaic may feel slow. No hard limit.' : '');
    setWarns(prev => [...prev, ...newWarns]);
  };

  const shareAll = async () => {
    if (!files.length) return setErr('drop some local images');
    setBusy(true);
    setErr('');
    setLinks([]);
    try {
      const results = await Promise.all(
        files.map(async (file, i) => {
          const res = await publishLocalFile(file, {
            caption: caption.trim() || 'from the lumen mosaic',
            color: accent,
            cardTitle: title.trim() || file.name,
            meta: { desk: 'lumenmosaic', index: i },
          });
          return res.ok && res.embed ? res.embed : null;
        })
      );
      setLinks(results.filter(Boolean) as string[]);
      if (results.every(r => !r)) setErr('uploads stalled');
    } catch (e: any) {
      setErr(e.message || 'something slowed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-32 pb-24 px-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 22 }}
          className="glass rounded-[32px] p-8 shadow-2xl"
        >
          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>Lumen Mosaic</p>
          <h1 className="text-[28px] font-semibold tracking-tight mb-3">Images that settle together.</h1>
          <p className="text-neutral-400 text-[14px] leading-relaxed mb-6">
            Drop several local images. Shape one shared title, caption, and accent. They arrange in a quiet mosaic with staggered Apple-style springs. Each becomes its own permanent Discord-ready link. Soft size warnings only. No hard limits.
          </p>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Shared title"
            className="w-full bg-black/20 border border-white/10 rounded-[16px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-3 focus:outline-none focus:border-white/20"
          />
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Shared caption…"
            rows={2}
            className="w-full bg-black/20 border border-white/10 rounded-[16px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-4 resize-none focus:outline-none focus:border-white/20"
          />

          <div className="flex items-center gap-4 mb-5">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0" />
            <label className="text-[13px] text-neutral-300 cursor-pointer hover:text-white transition">
              Add local images
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            </label>
            {files.length > 0 && <span className="text-[12px] text-neutral-500">{files.length} images</span>}
          </div>

          {warns.some(Boolean) && (
            <p className="text-[12px] text-amber-300/90 mb-3">Some images are large. Mosaic and upload may feel slow. No hard limit.</p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
            <AnimatePresence>
              {previews.map((src, i) => (
                <motion.div
                  key={src}
                  initial={{ opacity: 0, scale: 0.92, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 120, damping: 18, delay: i * 0.05 }}
                  className="aspect-square rounded-[18px] overflow-hidden bg-black/30"
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            onClick={shareAll}
            disabled={busy || !files.length}
            className="w-full rounded-[18px] py-3.5 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-lg"
            style={{ background: accent }}
          >
            {busy ? 'Settling mosaic…' : 'Share mosaic'}
          </motion.button>

          <AnimatePresence>
            {links.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-5 space-y-1">
                {links.map((l, i) => (
                  <a key={i} href={l} className="block text-[13px] break-all" style={{ color: accent }}>{l}</a>
                ))}
              </motion.div>
            )}
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-[12px] text-red-400">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
