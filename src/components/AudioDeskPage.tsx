import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function AudioDeskPage() {
  const [recording, setRecording] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ link?: string; error?: string; warn?: string | null } | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const b = new Blob(chunksRef.current, { type: mime });
        setBlob(b);
        const u = URL.createObjectURL(b);
        setUrl(u);
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRef.current = rec;
      rec.start();
      setRecording(true);
      setDuration(0);
      timerRef.current = window.setInterval(() => setDuration((d) => d + 1), 1000);
    } catch {
      setResult({ error: 'Microphone access needed to record.' });
    }
  };

  const stop = () => {
    mediaRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const publish = async () => {
    if (!blob || busy) return;
    setBusy(true);
    setResult(null);
    const file = new File([blob], `memo-${Date.now()}.webm`, { type: blob.type || 'audio/webm' });
    const res = await publishLocalFile(file, {
      caption: caption.trim() || 'Voice memo',
      color: accent,
      cardTitle: caption.trim() || 'Voice memo',
      meta: { desk: 'audiodesk', duration },
    });
    setResult({
      link: res.embed,
      error: res.error,
      warn: res.warn || (file.size > 40 * 1024 * 1024 ? 'Long memo — may feel slow to send. No hard limits.' : null),
    });
    setBusy(false);
  };

  const reset = () => {
    if (url) URL.revokeObjectURL(url);
    setBlob(null);
    setUrl(null);
    setDuration(0);
    setResult(null);
  };

  const mm = String(Math.floor(duration / 60)).padStart(2, '0');
  const ss = String(duration % 60).padStart(2, '0');

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 22 }}
          className="glass rounded-[36px] p-8 md:p-12"
        >
          <p className="text-[13px] font-medium tracking-wide mb-2" style={{ color: accent }}>Audio Desk</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">Record a memo.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Capture a voice note in the browser. It settles into the database as a file with a polished Discord embed on the link. Soft size warnings only — never hard limits. Apple-style springs on frosted glass.
          </p>

          <div className="flex flex-col items-center gap-6 mb-8">
            <div className="text-5xl font-medium tabular-nums tracking-tight">{mm}:{ss}</div>
            <motion.button
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.02 }}
              onClick={recording ? stop : start}
              className={`w-24 h-24 rounded-full grid place-items-center text-white text-sm font-medium shadow-xl ${
                recording ? 'bg-red-500' : ''
              }`}
              style={{ background: recording ? undefined : accent }}
            >
              {recording ? 'Stop' : 'Record'}
            </motion.button>
            {url && (
              <audio src={url} controls className="w-full max-w-xs" />
            )}
          </div>

          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional caption"
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition"
          />

          <div className="flex items-center gap-3 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-500">Accent for the embed</span>
          </div>

          {result?.warn && <p className="text-[13px] text-amber-300/80 mb-5">{result.warn}</p>}

          <AnimatePresence>
            {result?.link && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
                <a href={result.link} target="_blank" rel="noreferrer" className="text-sm text-blue-400 break-all">{result.link}</a>
              </motion.div>
            )}
            {result?.error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-400 mb-5">{result.error}</motion.p>
            )}
          </AnimatePresence>

          <div className="flex gap-3">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={publish}
              disabled={!blob || busy}
              className="flex-1 rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl"
              style={{ background: accent }}
            >
              {busy ? 'Publishing…' : 'Publish memo'}
            </motion.button>
            {blob && (
              <button onClick={reset} className="px-5 rounded-2xl text-sm text-neutral-400 hover:text-white">clear</button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
