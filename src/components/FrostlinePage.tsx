import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function FrostlinePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#5AC8FA');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [result, setResult] = useState<{ link?: string; error?: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setResult(null);
    setWarn(f.size > 40 * 1024 * 1024 ? 'Large file — the upload may feel slower. No hard limits.' : null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f.type.startsWith('image/') ? URL.createObjectURL(f) : null);
  }, [preview]);

  const publish = async () => {
    if (!file || busy) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await publishLocalFile(file, {
        caption: note.trim() || file.name,
        color: accent,
        cardTitle: file.name,
        meta: { desk: 'frostline' },
      });
      setResult(res.ok ? { link: res.embed } : { error: res.error || 'Could not publish' });
    } catch (e: any) {
      setResult({ error: e.message || 'Upload failed' });
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[40px] p-8 md:p-12 relative overflow-hidden"
        >
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[100px] pointer-events-none" style={{ background: `${accent}22` }} />
          <p className="text-[13px] font-medium tracking-wide mb-2" style={{ color: accent }}>Frostline</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">A single quiet drop.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            One local file settles into the database with an optional floating note. Soft size warnings only. Every share link carries a polished Discord embed. Apple-style spring motion on frosted glass.
          </p>

          <div
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-white/20'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('ring-2', 'ring-white/20')}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('ring-2', 'ring-white/20');
              if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
            }}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-white/12 rounded-3xl p-12 text-center mb-7 cursor-pointer hover:border-white/25 transition bg-black/20"
          >
            {preview ? (
              <img src={preview} alt="" className="max-h-40 mx-auto rounded-2xl object-cover" />
            ) : (
              <>
                <p className="text-neutral-300 text-[15px]">Drop one file</p>
                <p className="text-neutral-500 text-sm mt-1">or click to choose</p>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>

          {file && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-neutral-300 mb-5 truncate"
            >
              {file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB
            </motion.div>
          )}

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional floating note"
            rows={3}
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition resize-none"
          />

          <div className="flex items-center gap-3 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-500">Accent for the embed</span>
          </div>

          {warn && <p className="text-[13px] text-amber-300/80 mb-5">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || !file}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl"
            style={{ background: accent }}
          >
            {busy ? 'Settling…' : file ? 'Publish' : 'Drop a file first'}
          </motion.button>

          <AnimatePresence>
            {result?.link && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 glass rounded-2xl p-4"
              >
                <p className="text-xs text-neutral-500 mb-1">Share link</p>
                <a href={result.link} target="_blank" rel="noreferrer" className="text-sm text-blue-400 break-all">{result.link}</a>
              </motion.div>
            )}
            {result?.error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-sm text-red-400">
                {result.error}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
