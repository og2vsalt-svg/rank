import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function QuietGlowPage() {
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#FF9F0A');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ link?: string; error?: string } | null>(null);
  const [warn, setWarn] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = useCallback((f: File | null) => {
    setFile(f);
    setPreview(f && f.type.startsWith('image/') ? URL.createObjectURL(f) : null);
    setWarn(f && f.size > 40_000_000 ? 'Large file — upload may feel slower. No hard limits.' : null);
    setResult(null);
  }, []);

  const publish = async () => {
    if (busy) return;
    const text = note.trim();
    if (!text && !file) return;
    setBusy(true);
    setResult(null);
    try {
      const payloadFile = file || new File([text || 'glow'], 'quiet-glow.txt', { type: 'text/plain' });
      const res = await publishLocalFile(payloadFile, {
        caption: text || 'quiet glow',
        color: accent,
        cardTitle: text ? text.slice(0, 80) : 'quiet glow',
        meta: { desk: 'quietglow', accent },
      });
      if (res.ok && res.embed) {
        setResult({ link: res.embed });
      } else {
        setResult({ error: res.error || 'could not settle' });
      }
    } catch (e: any) {
      setResult({ error: e.message || 'failed' });
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[36px] p-8 md:p-12 relative overflow-hidden"
        >
          <motion.div
            className="absolute -inset-20 opacity-30 blur-3xl pointer-events-none"
            style={{ background: `radial-gradient(circle at 30% 20%, ${accent}66, transparent 60%)` }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="relative">
            <p className="text-[13px] font-medium tracking-wide mb-2" style={{ color: accent }}>Quiet Glow</p>
            <h1 className="text-4xl font-semibold tracking-tight mb-3">A soft light.</h1>
            <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
              Write a quiet note or drop a local file. Choose a warm accent. It settles into the database with a polished Discord embed on every link. Soft size warnings only — never hard limits. Apple-style springs on frosted glass.
            </p>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="a quiet note…"
              rows={4}
              className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition resize-none"
            />

            <div className="flex items-center gap-3 mb-6">
              <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0" />
              <span className="text-[13px] text-neutral-500">Accent glow for the embed</span>
            </div>

            <div
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-white/20'); }}
              onDragLeave={(e) => e.currentTarget.classList.remove('ring-2', 'ring-white/20')}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('ring-2', 'ring-white/20');
                const f = e.dataTransfer.files[0];
                if (f) onFile(f);
              }}
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed border-white/12 rounded-3xl p-10 text-center mb-7 cursor-pointer hover:border-white/25 transition bg-black/20"
            >
              {preview ? (
                <img src={preview} alt="" className="mx-auto max-h-40 rounded-2xl object-cover" />
              ) : (
                <>
                  <p className="text-neutral-300 text-[15px]">Optional file</p>
                  <p className="text-neutral-500 text-sm mt-1">drop or click</p>
                </>
              )}
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                onChange={(e) => onFile(e.target.files?.[0] || null)}
              />
            </div>

            {warn && <p className="text-[13px] text-amber-300/80 mb-5">{warn}</p>}

            <motion.button
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.005 }}
              onClick={publish}
              disabled={busy || (!note.trim() && !file)}
              className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl"
              style={{ background: accent }}
            >
              {busy ? 'Settling…' : 'Publish glow'}
            </motion.button>

            <AnimatePresence>
              {result?.link && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 glass rounded-2xl p-4"
                >
                  <p className="text-xs text-neutral-500 mb-1">share link</p>
                  <a href={result.link} target="_blank" rel="noreferrer" className="text-sm text-blue-400 break-all">{result.link}</a>
                  <button
                    onClick={() => navigator.clipboard.writeText(result.link!)}
                    className="mt-2 text-xs text-neutral-400 hover:text-white"
                  >
                    copy
                  </button>
                </motion.div>
              )}
              {result?.error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-sm text-red-400">
                  {result.error}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
