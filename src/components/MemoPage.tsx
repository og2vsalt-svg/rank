import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function MemoPage() {
  const [rec, setRec] = useState<MediaRecorder | null>(null);
  const [live, setLive] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState('');
  const [author, setAuthor] = useState('');
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#FF453A');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ embed?: string; error?: string; warn?: string | null } | null>(null);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState('');
  const streamRef = useRef<MediaStream | null>(null);

  const start = async () => {
    setErr('');
    setResult(null);
    setBlob(null);
    setUrl('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      mr.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      mr.onstop = () => {
        const b = new Blob(chunks, { type: mr.mimeType || 'audio/webm' });
        setBlob(b);
        setUrl(URL.createObjectURL(b));
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      setRec(mr);
      setLive(true);
    } catch {
      setErr('microphone access was blocked. allow it and try again.');
    }
  };

  const stop = () => {
    rec?.stop();
    setLive(false);
    setRec(null);
  };

  const share = async () => {
    if (!blob) return;
    setBusy(true);
    setResult(null);
    const file = new File([blob], `memo-${Date.now()}.webm`, { type: blob.type || 'audio/webm' });
    const res = await publishLocalFile(file, {
      author,
      caption: caption || 'voice memo',
      color,
      cardTitle: caption || 'voice memo',
      meta: { accent: color, source: 'memo', kind: 'audio' },
    });
    setResult({
      embed: res.id ? shareUrls(res.id).embed : undefined,
      error: res.ok ? undefined : res.error,
      warn: res.warn,
    });
    setBusy(false);
  };

  const copy = async () => {
    if (!result?.embed) return;
    await navigator.clipboard.writeText(result.embed);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-12">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 22 }}
        >
          <p className="text-[12px] uppercase tracking-[0.18em] text-white/40">memo</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">leave a voice note. share it quietly.</h1>
          <p className="mt-3 text-[15.5px] leading-relaxed text-white/65">
            Record a memo right in the browser. When you stop, it becomes a file that lands in storage and the public_shares table.
            The link unfurls a polished Discord card. Soft warning only if the recording runs long. No hard limits.
            Prior desks stay intact. No traces of boosting.
          </p>
        </motion.div>

        <div className="mt-8 glass rounded-[28px] p-8 text-center">
          {err && <p className="mb-4 text-[13px] text-red-300">{err}</p>}
          <div className="flex justify-center gap-3">
            {!live ? (
              <motion.button
                whileTap={{ scale: 0.96 }}
                whileHover={{ scale: 1.02 }}
                onClick={start}
                className="rounded-full bg-white px-6 py-3 text-[15px] font-medium text-black"
              >
                start recording
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={stop}
                className="rounded-full bg-red-500 px-6 py-3 text-[15px] font-medium text-white"
              >
                stop
              </motion.button>
            )}
          </div>
          {live && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 text-[13px] text-white/50"
            >
              listening… tap stop when finished
            </motion.p>
          )}
          {url && <audio src={url} controls className="mt-6 w-full" />}
        </div>

        {blob && (
          <div className="mt-6 space-y-3">
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="title for the card (optional)"
              className="glass w-full rounded-2xl px-4 py-3.5 text-[14px] outline-none"
            />
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="name, optional"
              className="glass w-full rounded-2xl px-4 py-3.5 text-[14px] outline-none"
            />
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-11 w-16 cursor-pointer rounded-xl border border-white/10 bg-transparent"
              />
              <span className="text-[13px] text-white/50">accent</span>
            </div>

            <motion.button
              whileTap={{ scale: 0.965 }}
              whileHover={{ scale: 1.012 }}
              onClick={share}
              disabled={busy}
              className="w-full rounded-full px-4 py-3.5 text-[15px] font-medium text-black disabled:opacity-40"
              style={{ background: color }}
            >
              {busy ? 'filing the memo…' : 'share the memo'}
            </motion.button>
          </div>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass mt-6 rounded-2xl px-4 py-4"
          >
            {result.embed ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[14px]">memo filed</p>
                  <button onClick={copy} className="rounded-full bg-white/10 px-3 py-1 text-[12px]">
                    {copied ? 'copied' : 'copy link'}
                  </button>
                </div>
                <p className="mt-2 break-all text-[12px] text-white/45">{result.embed}</p>
              </>
            ) : (
              <p className="text-[13px] text-red-300">{result.error || 'could not file the memo'}</p>
            )}
            {result.warn && <p className="mt-2 text-[12px] text-amber-200/80">{result.warn}</p>}
          </motion.div>
        )}
      </main>
    </div>
  );
}
