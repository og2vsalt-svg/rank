import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function GarboardPage() {
  const [note, setNote] = useState('');
  const [rec, setRec] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [secs, setSecs] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [card, setCard] = useState('');
  const recRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const tick = useRef<number | null>(null);

  useEffect(() => () => {
    recRef.current?.stop();
    if (tick.current) window.clearInterval(tick.current);
  }, []);

  async function start() {
    setErr('');
    setBlob(null);
    setCard('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunks.current = [];
      mr.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const out = new Blob(chunks.current, { type: mr.mimeType || 'audio/webm' });
        setBlob(out);
        if (out.size > 12 * 1024 * 1024) setWarn('long memo. the send may feel slow. nothing is refused.');
      };
      mr.start();
      recRef.current = mr;
      setSecs(0);
      setRec(true);
      tick.current = window.setInterval(() => setSecs((n) => n + 1), 1000);
    } catch {
      setErr('the mic stayed closed. you can still file a written note.');
    }
  }

  function stop() {
    recRef.current?.stop();
    setRec(false);
    if (tick.current) window.clearInterval(tick.current);
  }

  async function fileIt() {
    setErr('');
    if (!blob && !note.trim()) {
      setErr('record a memo, or write the line.');
      return;
    }
    setBusy(true);
    const file = blob
      ? new File([blob], `garboard-${Date.now()}.webm`, { type: blob.type || 'audio/webm' })
      : new File([note], 'garboard.txt', { type: 'text/plain' });
    const res = await publishLocalFile(file, {
      cardTitle: note.trim().slice(0, 80) || 'garboard memo',
      caption: note.trim().slice(0, 280) || `${secs || 0}s memo`,
      author: 'garboard',
      color: '#5E5CE6',
    });
    setBusy(false);
    if (!res.ok || !res.id) {
      setErr(res.error || 'the share table did not take it.');
      return;
    }
    setCard(res.embed || shareUrls(res.id).embed);
    if (res.warn) setWarn(res.warn);
  }

  const clock = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] uppercase tracking-[0.16em] text-zinc-500">garboard</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="mt-2 text-4xl font-semibold tracking-tight">A memo, not a drawer.</motion.h1>
        <p className="mt-3 text-[15px] leading-relaxed text-zinc-400">Speak into the tab. The audio lands in the share table, and Discord gets a card. A written line works if the mic does not.</p>
        <div className="mt-8 space-y-3 rounded-[28px] border border-white/10 bg-white/[0.04] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl">
          <div className="flex items-center justify-between rounded-2xl bg-black/30 px-4 py-4">
            <span className="font-medium tabular-nums tracking-tight">{clock}</span>
            <button onClick={rec ? stop : start} className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition active:scale-[0.98]">{rec ? 'stop' : 'record'}</button>
          </div>
          {blob && <p className="text-xs text-zinc-400">memo ready · {Math.max(1, Math.round(blob.size / 1024))} KB</p>}
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="the line on the card" rows={3} className="w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#5E5CE6]/60" />
          {warn && <p className="text-xs text-amber-200/80">{warn}</p>}
          <button onClick={fileIt} disabled={busy || rec} className="w-full rounded-full bg-white py-3 text-sm font-medium text-black transition active:scale-[0.98] disabled:opacity-60">{busy ? 'filing…' : 'file the memo'}</button>
          {err && <p className="text-sm text-red-300">{err}</p>}
          {card && (
            <button onClick={() => navigator.clipboard.writeText(card)} className="w-full rounded-2xl bg-[#5E5CE6]/15 px-3 py-3 text-left text-xs text-[#c7c4ff]">{card}<span className="mt-1 block text-[11px] text-zinc-400">copied when you tap. paste it in Discord.</span></button>
          )}
        </div>
      </main>
    </div>
  );
}
