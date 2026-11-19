import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function QuietBeaconPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [accent, setAccent] = useState('#FF9500');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ link?: string; error?: string } | null>(null);
  const [warn, setWarn] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = useCallback((f: File) => {
    setFile(f);
    setWarn(f.size > 40 * 1024 * 1024 ? 'Large file — may feel slower to settle. No hard limits.' : null);
    if (f.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  }, []);

  const publish = async () => {
    if (!file || busy) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await publishLocalFile(file, {
        caption: message.trim() || 'a quiet beacon',
        color: accent,
        cardTitle: file.name,
        meta: { desk: 'beacon', message: message.trim() },
      });
      setResult({ link: res.embed, error: res.error });
    } catch (e: any) {
      setResult({ error: e.message });
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[36px] p-8 md:p-12 relative overflow-hidden"
        >
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{ background: `radial-gradient(circle at center, ${accent}40, transparent 70%)` }}
          />
          <p className="text-[13px] font-medium tracking-wide mb-2 relative" style={{ color: accent }}>Quiet Beacon</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 relative">A still light.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8 relative">
            Drop one local file. Add a short message. It settles into the database as a quiet beacon with a polished Discord embed on every link. Soft size warnings only — never hard limits. Apple-style springs on frosted glass.
          </p>

          <div
            onDragOver={(e) => { e.preventDefault(); }}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]);
            }}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-white/12 rounded-3xl p-12 text-center mb-7 cursor-pointer hover:border-white/25 transition bg-black/20 relative"
          >
            {preview ? (
              <img src={preview} alt="" className="max-h-48 mx-auto rounded-2xl object-contain" />
            ) : (
              <>
                <p className="text-neutral-300 text-[15px]">Drop a file or click</p>
                <p className="text-neutral-500 text-sm mt-1">single intentional drop</p>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
            />
          </div>

          {file && (
            <p className="text-sm text-neutral-400 mb-4 relative">
              {file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB
            </p>
          )}

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Beacon message (optional)"
            rows={3}
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition relative resize-none"
          />

          <div className="flex items-center gap-3 mb-6 relative">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-500">Glow accent</span>
          </div>

          {warn && <p className="text-[13px] text-amber-300/80 mb-5 relative">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={publish}
            disabled={busy || !file}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl relative"
            style={{ background: accent }}
          >
            {busy ? 'Settling…' : file ? 'Light the beacon' : 'Drop a file first'}
          </motion.button>

          <AnimatePresence>
            {result?.link && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 glass rounded-2xl p-4 relative"
              >
                <p className="text-sm text-neutral-300 mb-1">Beacon ready</p>
                <a href={result.link} target="_blank" rel="noreferrer" className="text-sm text-blue-400 break-all">{result.link}</a>
                <p className="text-xs text-neutral-500 mt-1">Discord embed ready on this link</p>
              </motion.div>
            )}
            {result?.error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-400 mt-4 relative">{result.error}</motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
