import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function DolphinPage() {
  const [rec, setRec] = useState<MediaRecorder | null>(null);
  const [chunks, setChunks] = useState<Blob[]>([]);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [card, setCard] = useState('');
  const [error, setError] = useState('');
  const [warn, setWarn] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current) window.clearInterval(timer.current);
    if (url) URL.revokeObjectURL(url);
  }, [url]);

  const start = async () => {
    setError('');
    setCard('');
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
    const media = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    const local: Blob[] = [];
    media.ondataavailable = (e) => { if (e.data.size) local.push(e.data); };
    media.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      const next = new Blob(local, { type: media.mimeType || 'audio/webm' });
      setChunks(local);
      setBlob(next);
      setUrl(URL.createObjectURL(next));
    };
    media.start();
    setRec(media);
    setSeconds(0);
    timer.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
  };

  const stop = () => {
    rec?.stop();
    setRec(null);
    if (timer.current) window.clearInterval(timer.current);
  };

  const send = async () => {
    if (!blob) return;
    setBusy(true);
    setError('');
    const file = new File([blob], `dolphin-${Date.now()}.webm`, { type: blob.type || 'audio/webm' });
    const res = await publishLocalFile(file, { caption: caption.trim().slice(0, 180), color: '#30D158' });
    setBusy(false);
    if (!res.ok || !res.id) {
      setError(res.error || 'the clip did not land');
      return;
    }
    setCard(res.embed || shareUrls(res.id).embed);
    setWarn(res.warn || (blob.size > 12 * 1024 * 1024 ? 'long take. the tab may feel slow while it sends. nothing is refused.' : null));
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">dolphin</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">a voice on the pile</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">Record in the tab, then file the clip in the share database. Discord gets a card for the link. The pile is not a size gate.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.55 }} className="glass mt-8 rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-[15px] text-white">{rec ? `listening · ${seconds}s` : blob ? 'take ready' : 'mic stays on this page until you stop'}</p>
            {!rec ? (
              <button onClick={start} className="rounded-full bg-white px-4 py-2 text-[13px] font-medium text-black">start</button>
            ) : (
              <button onClick={stop} className="rounded-full bg-[#ff453a] px-4 py-2 text-[13px] font-medium text-white">stop</button>
            )}
          </div>
          {url && <audio src={url} controls className="mt-4 w-full" />}
          <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="caption for the card" className="mt-3 w-full rounded-2xl bg-black/30 px-4 py-3 text-[15px] outline-none placeholder:text-white/30" />
          <button onClick={send} disabled={!blob || busy} className="mt-4 rounded-full bg-white/10 px-5 py-2.5 text-[14px] text-white transition hover:bg-white/15 disabled:opacity-40">{busy ? 'filing…' : 'file the take'}</button>
          {chunks.length > 0 && <p className="mt-2 text-[12px] text-white/35">{chunks.length} chunk{chunks.length === 1 ? '' : 's'} in this take</p>}
          {warn && <p className="mt-3 text-[13px] text-amber-200/80">{warn}</p>}
          {error && <p className="mt-3 text-[13px] text-red-300/90">{error}</p>}
          {card && <p className="mt-3 truncate text-[13px] text-white/70">{card}</p>}
        </motion.div>
      </main>
    </div>
  );
}
