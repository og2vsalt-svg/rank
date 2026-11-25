import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function EchoLoomPage() {
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#AF52DE');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!file || !file.type.startsWith('audio/')) return;
    const url = URL.createObjectURL(file);
    if (audioRef.current) audioRef.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const draw = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const w = c.width;
    const h = c.height;
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < w; i++) {
      const y = h / 2 + Math.sin(i * 0.08 + Date.now() * 0.004) * (h * 0.25);
      if (i === 0) ctx.moveTo(i, y);
      else ctx.lineTo(i, y);
    }
    ctx.stroke();
  };

  useEffect(() => {
    let id: number;
    const loop = () => {
      draw();
      id = requestAnimationFrame(loop);
    };
    if (file?.type.startsWith('audio/')) loop();
    return () => cancelAnimationFrame(id);
  }, [file, accent]);

  const save = async () => {
    if (!file && !note.trim()) return setErr('add a note or an audio file');
    setBusy(true);
    setErr('');
    setLink(null);
    try {
      if (file) {
        const res = await publishLocalFile(file, {
          caption: note.trim() || 'from the echo loom',
          color: accent,
          cardTitle: file.name,
          meta: { desk: 'echoloom' },
        });
        if (res.ok && res.embed) setLink(res.embed);
        else if (!res.ok) setErr(res.error || 'upload failed');
        setFile(null);
      }
      if (note.trim() && !file) {
        // pure note — create a tiny text file share
        const blob = new Blob([note.trim()], { type: 'text/plain' });
        const textFile = new File([blob], 'echo-note.txt', { type: 'text/plain' });
        const res = await publishLocalFile(textFile, {
          caption: note.trim(),
          color: accent,
          cardTitle: 'echo note',
          meta: { desk: 'echoloom' },
        });
        if (res.ok && res.embed) setLink(res.embed);
      }
      setNote('');
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
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          className="glass rounded-[28px] p-8"
        >
          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>Echo Loom</p>
          <h1 className="text-[28px] font-semibold tracking-tight mb-3">Sound and quiet notes, woven.</h1>
          <p className="text-neutral-400 text-[14px] leading-relaxed mb-6">
            Drop an audio file or write a short note. Audio plays with a soft living waveform. Everything publishes as a permanent Discord-ready share. Soft size warnings only. Apple-style springs. No boosting.
          </p>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="A quiet line or caption…"
            rows={3}
            className="w-full bg-black/20 border border-white/10 rounded-[16px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-4 resize-none focus:outline-none"
          />

          <div className="flex items-center gap-4 mb-4">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0" />
            <label className="text-[13px] text-neutral-300 cursor-pointer">
              {file ? file.name : 'Attach audio or any local file'}
              <input type="file" accept="audio/*,*/*" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setFile(f);
                setWarn(f && f.size > 40 * 1024 * 1024 ? 'Large file — the upload may feel slow. No hard limit.' : null);
              }} />
            </label>
          </div>

          {file?.type.startsWith('audio/') && (
            <>
              <canvas ref={canvasRef} width={320} height={64} className="w-full h-16 rounded-[12px] bg-black/30 mb-3" />
              <audio ref={audioRef} controls className="w-full mb-4" />
            </>
          )}

          {warn && <p className="text-[12px] text-amber-300/90 mb-3">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            onClick={save}
            disabled={busy || (!file && !note.trim())}
            className="w-full rounded-[18px] py-3.5 text-[15px] font-medium text-white disabled:opacity-40"
            style={{ background: accent }}
          >
            {busy ? 'Weaving…' : 'Weave share'}
          </motion.button>

          <AnimatePresence>
            {link && (
              <motion.a initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} href={link} className="block mt-5 text-[13px] break-all" style={{ color: accent }}>
                {link}
              </motion.a>
            )}
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-[12px] text-red-400">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
