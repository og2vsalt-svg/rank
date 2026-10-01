import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function KeelsonPage() {
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const [live, setLive] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState<string | null>(null);
  const [id, setId] = useState('');

  const start = async () => {
    setErr('');
    setId('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunks.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunks.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const next = new Blob(chunks.current, { type: recorder.mimeType || 'audio/webm' });
        setBlob(next);
        setUrl(URL.createObjectURL(next));
        setWarn(next.size > 12 * 1024 * 1024 ? 'long take. sending it may feel slow.' : null);
      };
      recorder.start();
      rec.current = recorder;
      setLive(true);
    } catch {
      setErr('microphone permission was declined');
    }
  };

  const stop = () => {
    rec.current?.stop();
    setLive(false);
  };

  const publish = async () => {
    if (!blob) return;
    setBusy(true);
    setErr('');
    const file = new File([blob], `keelson-${Date.now().toString(36)}.webm`, { type: blob.type || 'audio/webm' });
    const res = await publishLocalFile(file, { caption: 'voice note' });
    setBusy(false);
    if (!res.ok || !res.id) {
      setErr(res.error || 'could not land the take');
      return;
    }
    setId(res.id);
    setWarn(res.warn || warn);
  };

  const card = id ? shareUrls(id).embed : '';

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">keelson</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">hold a voice note, then share it</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">
            Recording stays on this device until you publish. The take is a normal file row, so the Discord card can play it.
          </p>
        </motion.div>
        <div className="mt-8 flex gap-2">
          {!live ? (
            <button onClick={start} className="rounded-full bg-[#0A84FF] px-5 py-2.5 text-[14px] font-medium transition-transform active:scale-[0.98]">record</button>
          ) : (
            <button onClick={stop} className="rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-black transition-transform active:scale-[0.98]">stop</button>
          )}
          {live && <span className="self-center text-[13px] text-white/50">listening…</span>}
        </div>
        {url && (
          <motion.audio initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 w-full" controls src={url} />
        )}
        {warn && <p className="mt-3 text-[13px] text-amber-200">{warn}</p>}
        <button onClick={publish} disabled={busy || !blob} className="mt-5 rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-black transition-transform active:scale-[0.98] disabled:opacity-50">
          {busy ? 'sending…' : 'publish take'}
        </button>
        {err && <p className="mt-3 text-[13px] text-red-300">{err}</p>}
        {card && <p className="mt-4 break-all text-[13px] text-white/70">{card}</p>}
      </main>
    </div>
  );
}
