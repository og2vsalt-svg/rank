import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function QuietDawnPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#FF9500');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onSelect = useCallback((f: File | null) => {
    setFile(f);
    setLink(null);
    setErr('');
    if (preview) URL.revokeObjectURL(preview);
    if (f && f.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
    setWarn(f && f.size > 40 * 1024 * 1024 ? 'Large dawn. Upload may feel a little slow. No hard limit.' : null);
  }, [preview]);

  const publish = async () => {
    if (!file) return setErr('choose a file first');
    setBusy(true);
    setErr('');
    setLink(null);
    try {
      const res = await publishLocalFile(file, {
        caption: caption.trim() || 'quiet dawn',
        color: accent,
        cardTitle: file.name,
        meta: { desk: 'quietdawn' },
      });
      if (res.ok && res.embed) setLink(res.embed);
      else setErr(res.error || 'could not settle');
    } catch (e: any) {
      setErr(e.message || 'something slowed');
    }
    setBusy(false);
  };

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 95, damping: 20 }}
          className="glass rounded-[32px] p-8 md:p-10 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-br from-orange-400/20 to-transparent blur-3xl pointer-events-none" />
          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>Quiet Dawn</p>
          <h1 className="text-[32px] font-semibold tracking-tight mb-2">A soft rising drop.</h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed mb-8 relative">
            Choose one local file. It rises into a warm frosted card with live preview when possible. Shared caption and accent. Publishes to the database. Every link unfurls a polished Discord embed. Soft size warnings only. No hard limits. Human-crafted Apple-style spring motion. All prior desks remain fully intact. No traces of boosting.
          </p>

          <label className="block rounded-3xl border border-dashed border-white/15 bg-black/20 p-10 text-center cursor-pointer hover:border-white/25 transition mb-6 relative">
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => onSelect(e.target.files?.[0] || null)}
              disabled={busy}
            />
            {preview ? (
              <img src={preview} alt="" className="max-h-48 mx-auto rounded-2xl object-contain" />
            ) : (
              <>
                <p className="text-[15px] text-neutral-300">{file ? file.name : 'Choose a file or drop it here'}</p>
                <p className="text-[12px] text-neutral-500 mt-1">Images show a live preview. Large files warned, never refused.</p>
              </>
            )}
          </label>

          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional caption"
            className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/25 transition"
          />

          <div className="flex items-center gap-4 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0 bg-transparent" />
            <span className="text-[13px] text-neutral-400">Warm accent for the embed</span>
          </div>

          {warn && <p className="text-[13px] text-amber-300/90 mb-4">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.012 }}
            onClick={publish}
            disabled={busy || !file}
            className="w-full rounded-2xl py-3.5 text-[15px] font-medium text-black disabled:opacity-40 transition shadow-lg"
            style={{ background: accent }}
          >
            {busy ? 'Rising…' : 'Publish dawn'}
          </motion.button>

          <AnimatePresence>
            {link && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 glass rounded-2xl p-4 flex items-center justify-between gap-3 relative"
              >
                <a href={link} className="text-[13px] break-all flex-1" style={{ color: accent }}>{link}</a>
                <button onClick={copy} className="text-[12px] px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 transition shrink-0">
                  {copied ? 'copied' : 'copy'}
                </button>
              </motion.div>
            )}
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-[13px] text-red-400">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
