import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function StillwaterPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#5AC8FA');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [result, setResult] = useState<{ link?: string; error?: string } | null>(null);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);

  const selectFile = useCallback((f: File) => {
    setFile(f);
    setResult(null);
    setWarn(f.size > 40_000_000 ? 'Large file — the water may take a moment to settle. No hard limits.' : null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f.type.startsWith('image/') ? URL.createObjectURL(f) : null);
  }, [preview]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) {
      selectFile(f);
      // trigger a ripple at drop point
      const rect = surfaceRef.current?.getBoundingClientRect();
      if (rect) {
        setRipples(r => [...r, { id: Date.now(), x: e.clientX - rect.left, y: e.clientY - rect.top }]);
        setTimeout(() => setRipples(r => r.slice(1)), 1200);
      }
    }
  }, [selectFile]);

  const onClickSurface = (e: React.MouseEvent) => {
    inputRef.current?.click();
    const rect = surfaceRef.current?.getBoundingClientRect();
    if (rect) {
      setRipples(r => [...r, { id: Date.now(), x: e.clientX - rect.left, y: e.clientY - rect.top }]);
      setTimeout(() => setRipples(r => r.slice(1)), 1200);
    }
  };

  const publish = async () => {
    if (!file || busy) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await publishLocalFile(file, {
        caption: note.trim() || file.name,
        color: accent,
        cardTitle: file.name,
        meta: { desk: 'stillwater' },
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
      <div className="pt-28 pb-24 px-5 max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 22 }}
          className="glass rounded-[40px] p-8 md:p-12 relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 60%, ${accent}33, transparent 70%)` }} />

          <p className="text-[13px] font-medium tracking-wide mb-2 relative" style={{ color: accent }}>Stillwater</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 relative">Calm surface.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8 relative">
            A still surface for a single drop. Gentle ripples on contact, soft reflections, and a polished Discord embed. Soft size warnings only. Apple-style springs on frosted glass.
          </p>

          <motion.div
            ref={surfaceRef}
            onDragOver={(e) => { e.preventDefault(); }}
            onDrop={onDrop}
            onClick={onClickSurface}
            whileHover={{ scale: 1.005 }}
            className="relative border-2 border-dashed border-white/15 rounded-3xl p-12 text-center mb-7 cursor-pointer hover:border-white/25 transition bg-black/20 overflow-hidden"
          >
            {ripples.map(r => (
              <motion.span
                key={r.id}
                className="absolute rounded-full border border-white/30 pointer-events-none"
                style={{ left: r.x - 40, top: r.y - 40, width: 80, height: 80 }}
                initial={{ scale: 0, opacity: 0.6 }}
                animate={{ scale: 2.5, opacity: 0 }}
                transition={{ duration: 1.1, ease: 'easeOut' }}
              />
            ))}
            {preview ? (
              <img src={preview} alt="preview" className="max-h-48 mx-auto rounded-2xl object-contain mb-4 relative z-10" />
            ) : (
              <div className="text-neutral-400 relative z-10">
                <p className="text-[15px]">Drop one file</p>
                <p className="text-sm mt-1 text-neutral-500">or tap the surface</p>
              </div>
            )}
            {file && <p className="text-xs text-neutral-500 mt-3 relative z-10">{file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</p>}
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && selectFile(e.target.files[0])}
            />
          </motion.div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional quiet note"
            rows={2}
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition resize-none"
          />

          <div className="flex items-center gap-3 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-500">Accent for the embed</span>
          </div>

          {warn && <p className="text-[13px] text-amber-300/80 mb-5">{warn}</p>}

          <AnimatePresence>
            {result?.link && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-4 mb-4"
              >
                <a href={result.link} target="_blank" rel="noreferrer" className="text-sm text-blue-400 break-all">{result.link}</a>
              </motion.div>
            )}
            {result?.error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-400 mb-4">{result.error}</motion.p>
            )}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || !file}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl relative"
            style={{ background: accent }}
          >
            {busy ? 'Settling…' : file ? 'Release' : 'Choose a file'}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
