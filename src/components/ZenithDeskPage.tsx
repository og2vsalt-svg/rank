import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function ZenithDeskPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(null);
  }, [file]);

  const publish = async () => {
    if (!file) return setErr('choose a local file');
    setBusy(true);
    setErr('');
    setLink(null);
    try {
      const res = await publishLocalFile(file, {
        caption: caption.trim() || 'from the zenith desk',
        color: accent,
        cardTitle: title.trim() || file.name,
        meta: { desk: 'zenith' },
      });
      if (res.ok && res.embed) setLink(res.embed);
      else if (!res.ok) setErr(res.error || 'upload failed');
      setFile(null);
      setTitle('');
      setCaption('');
    } catch (e: any) {
      setErr(e.message || 'something slowed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen bg-[#0b0b0d]">
      <Navbar />
      <div className="pt-32 pb-24 px-6 max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 130, damping: 20 }}
          className="glass rounded-[32px] p-8 relative overflow-hidden"
        >
          <motion.div
            className="absolute inset-0 opacity-20"
            style={{ background: `radial-gradient(circle at 30% 20%, ${accent}, transparent 60%)` }}
            animate={{ opacity: [0.15, 0.28, 0.15] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <p className="text-[13px] font-medium tracking-wide mb-1 relative" style={{ color: accent }}>Zenith Desk</p>
          <h1 className="text-[30px] font-semibold tracking-tight mb-3 relative">The high point of a single share.</h1>
          <p className="text-neutral-400 text-[14px] leading-relaxed mb-6 relative">
            One local file, shaped with title, caption, and accent. Live preview for images. Permanent Discord-ready link. Soft size warning only. Apple-style springs and frosted glass. Prior features stay.
          </p>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full bg-black/20 border border-white/10 rounded-[16px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-3 relative focus:outline-none"
          />
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Caption"
            rows={2}
            className="w-full bg-black/20 border border-white/10 rounded-[16px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-4 relative resize-none focus:outline-none"
          />

          <div className="flex items-center gap-4 mb-5 relative">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0" />
            <label className="flex-1 text-[13px] text-neutral-300 cursor-pointer border border-dashed border-white/15 rounded-[16px] py-5 text-center hover:border-white/30 transition">
              {file ? file.name : 'Choose local file'}
              <input type="file" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setFile(f);
                setWarn(f && f.size > 40 * 1024 * 1024 ? 'Large file — browser may feel slow. No hard limit.' : null);
              }} />
            </label>
          </div>

          {preview && (
            <motion.img
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              src={preview}
              alt=""
              className="w-full rounded-[20px] mb-5 relative"
            />
          )}

          {warn && <p className="text-[12px] text-amber-300/90 mb-3 relative">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            onClick={publish}
            disabled={busy || !file}
            className="w-full rounded-[18px] py-3.5 text-[15px] font-medium text-white disabled:opacity-40 relative shadow-lg"
            style={{ background: accent }}
          >
            {busy ? 'Rising…' : 'Publish zenith share'}
          </motion.button>

          <AnimatePresence>
            {link && (
              <motion.a initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} href={link} className="block mt-5 text-[13px] break-all relative" style={{ color: accent }}>
                {link}
              </motion.a>
            )}
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-[12px] text-red-400 relative">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
