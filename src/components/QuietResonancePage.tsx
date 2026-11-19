import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function QuietResonancePage() {
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#64D2FF');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const publish = async () => {
    if (!file || busy) return;
    setBusy(true);
    setWarn(null);
    try {
      if (file.size > 40 * 1024 * 1024) setWarn('Large resonance — may feel slow while it settles. No hard limits.');
      const res = await publishLocalFile(file, {
        caption: note.trim().slice(0, 160) || file.name,
        color: accent,
        cardTitle: 'Quiet Resonance',
        meta: { desk: 'quiet-resonance', note: note.trim() || null },
      });
      if (res.ok && res.embed) setLink(res.embed);
      else setWarn(res.error || 'publish failed');
    } catch (e: any) {
      setWarn(e.message || 'failed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 80, damping: 22 }}
          className="glass rounded-[36px] p-8 md:p-12 relative overflow-hidden"
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
        >
          <motion.div
            className="absolute -inset-px rounded-[36px] opacity-40 pointer-events-none"
            style={{ background: `radial-gradient(ellipse at 50% 40%, ${accent}44, transparent 70%)` }}
            animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.55, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <p className="text-[13px] font-medium tracking-wide mb-2 relative" style={{ color: accent }}>Quiet Resonance</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 relative">Let it resonate.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8 relative">
            Drop a local file. Add a quiet resonance note. Soft ambient pulse on frosted glass. Settles into the database with a polished Discord embed on every link. Soft size warnings only — never hard limits. Apple-style springs.
          </p>

          <div
            onClick={() => inputRef.current?.click()}
            className="border border-dashed border-white/20 rounded-2xl p-8 text-center cursor-pointer hover:border-white/40 transition mb-5 relative"
          >
            {file ? (
              <p className="text-[15px] text-white">{file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</p>
            ) : (
              <p className="text-neutral-500">Drop a file or click to choose</p>
            )}
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
            />
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Resonance note…"
            rows={3}
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition resize-none relative"
          />

          <div className="flex items-center gap-3 mb-6 relative">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-500">Pulse accent</span>
          </div>

          {warn && <p className="text-[13px] text-amber-300/80 mb-5 relative">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || !file}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl relative"
            style={{ background: accent }}
          >
            {busy ? 'Resonating…' : 'Publish resonance'}
          </motion.button>

          {link && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 text-center relative">
              <a href={link} target="_blank" rel="noreferrer" className="text-sm text-blue-400 break-all">{link}</a>
              <p className="text-xs text-neutral-500 mt-1">Discord-ready link</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
