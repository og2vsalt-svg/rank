import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useAuth } from './AuthContext';
import { publishShare, shareUrls } from '../lib/cloudShare';

function rid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export default function WhisperPage() {
  const { user } = useAuth();
  const recRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [done, setDone] = useState<{ embed: string; app: string } | null>(null);

  const start = async () => {
    setErr('');
    setDone(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunks.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunks.current.push(e.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const b = new Blob(chunks.current, { type: rec.mimeType || 'audio/webm' });
        setBlob(b);
        setUrl(URL.createObjectURL(b));
        if (b.size > 8 * 1024 * 1024) setWarn('long take. still ships, might feel slow.');
      };
      rec.start();
      recRef.current = rec;
      setRecording(true);
    } catch {
      setErr('mic access blocked. allow it and try again.');
    }
  };

  const stop = () => {
    recRef.current?.stop();
    setRecording(false);
  };

  const publish = async () => {
    if (!blob) return;
    setBusy(true);
    setErr('');
    try {
      const file = new File([blob], `whisper-${Date.now()}.webm`, { type: blob.type || 'audio/webm' });
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('could not read take'));
        r.readAsDataURL(file);
      });
      const id = rid();
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl,
        author: user?.username,
      });
      if (!res.ok) {
        setErr(res.error || 'could not park the take');
        return;
      }
      const urls = shareUrls(res.id || id);
      setDone({ embed: urls.embed, app: urls.app });
    } catch (e: any) {
      setErr(e?.message || 'upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#0a84ff] mb-3">create</p>
          <h1 className="text-4xl font-semibold tracking-tight">whisper</h1>
          <p className="text-neutral-400 mt-3 text-[15px] leading-relaxed">record a quiet voice note. park it in the same public drop table as harbor. no hard cap, just a slowness warning if it runs long.</p>
          <div className="glass rounded-3xl p-6 mt-8">
            <div className="flex items-center gap-3">
              {!recording ? (
                <button onClick={start} className="px-5 py-2.5 rounded-full bg-[#0a84ff] text-white text-sm font-medium">start take</button>
              ) : (
                <button onClick={stop} className="px-5 py-2.5 rounded-full bg-white/10 text-white text-sm font-medium">stop</button>
              )}
              {recording && <span className="text-sm text-red-400 animate-pulse">recording</span>}
            </div>
            {url && <audio className="w-full mt-5" controls src={url} />}
            {warn && <p className="text-amber-300/90 text-sm mt-4">{warn}</p>}
            {err && <p className="text-red-400 text-sm mt-4">{err}</p>}
            {blob && (
              <button disabled={busy} onClick={publish} className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50">
                {busy ? 'parking…' : 'publish drop'}
              </button>
            )}
            {done && (
              <div className="mt-5 space-y-2 text-sm">
                <p className="text-neutral-400">live embed (discord-ready)</p>
                <code className="block break-all text-[#0a84ff]">{done.embed}</code>
                <p className="text-neutral-400">app link</p>
                <code className="block break-all text-neutral-300">{done.app}</code>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
