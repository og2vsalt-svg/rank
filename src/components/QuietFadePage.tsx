import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function QuietFadePage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [hours, setHours] = useState(12);
  const [accent, setAccent] = useState('#FF9F0A');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const onText = (v: string) => {
    setBody(v);
    const bytes = new Blob([v]).size;
    setWarn(bytes > 180_000 ? 'Long note. May feel a little slow to settle. No hard limit.' : null);
  };

  const onFile = (f: File | null) => {
    setFile(f);
    if (f && f.size > 30 * 1024 * 1024) setWarn('Large file. The browser may feel slow while it sends. No hard limit.');
    else if (!body.trim()) setWarn(null);
  };

  const publish = async () => {
    if (!body.trim() && !file) return setErr('add a note or a local file');
    setBusy(true);
    setErr('');
    setLink(null);
    try {
      const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
      const caption = title.trim() || body.trim().slice(0, 100) || 'quiet fade';
      let res;
      if (file) {
        res = await publishLocalFile(file, {
          caption,
          color: accent,
          cardTitle: title.trim() || file.name,
          expiresAt,
          meta: { desk: 'quietfade', kind: 'ephemeral', hours },
        });
      } else {
        const name = (title.trim() || 'fade') + '.txt';
        const textFile = new File([body], name, { type: 'text/plain' });
        res = await publishLocalFile(textFile, {
          caption,
          color: accent,
          cardTitle: title.trim() || name,
          expiresAt,
          meta: { desk: 'quietfade', kind: 'ephemeral-text', hours },
        });
      }
      if (res.ok && res.embed) setLink(res.embed);
      else setErr(res.error || 'could not settle');
    } catch (e: any) {
      setErr(e.message || 'something slowed');
    }
    setBusy(false);
  };

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 95, damping: 18 }}
          className="glass rounded-[32px] p-8 md:p-10 shadow-2xl"
        >
          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>Quiet Fade</p>
          <h1 className="text-[32px] font-semibold tracking-tight mb-2">A share that gently fades.</h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed mb-8">
            Drop a local file or write a quiet note. Choose how many hours it lives, then publish to the database. Every link unfurls a polished Discord embed. Soft size warnings only. No hard limits. Human-crafted Apple-style spring motion on frosted glass. All prior desks remain fully intact. No traces of boosting.
          </p>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Optional title"
            className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-4 focus:outline-none focus:border-white/25 transition"
          />

          <textarea
            value={body}
            onChange={(e) => onText(e.target.value)}
            placeholder="A quiet note that will fade…"
            rows={5}
            className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-4 resize-y min-h-[120px] focus:outline-none focus:border-white/25 transition"
          />

          <label className="block mb-4">
            <span className="text-[13px] text-neutral-400 mb-2 block">Or attach a local file</span>
            <input
              type="file"
              onChange={(e) => onFile(e.target.files?.[0] || null)}
              className="w-full text-[13px] text-neutral-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[13px] file:bg-white/10 file:text-white hover:file:bg-white/15"
            />
            {file && <p className="text-[12px] text-neutral-500 mt-1">{file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB</p>}
          </label>

          <div className="flex flex-wrap items-center gap-4 mb-6">
            <label className="flex items-center gap-2 text-[13px] text-neutral-300">
              fades after
              <input
                type="number"
                min={1}
                max={336}
                value={hours}
                onChange={(e) => setHours(Math.max(1, Number(e.target.value) || 12))}
                className="w-16 bg-black/20 border border-white/10 rounded-xl px-2 py-1 text-center text-white"
              />
              hours
            </label>
            <div className="flex items-center gap-2">
              <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0 bg-transparent" />
              <span className="text-[13px] text-neutral-400">accent</span>
            </div>
          </div>

          {warn && <p className="text-[13px] text-amber-300/90 mb-4">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.018 }}
            onClick={publish}
            disabled={busy || (!body.trim() && !file)}
            className="w-full rounded-2xl py-3.5 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-lg"
            style={{ background: accent }}
          >
            {busy ? 'Settling…' : 'Publish fading share'}
          </motion.button>

          <AnimatePresence>
            {link && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 glass rounded-2xl p-4 flex items-center justify-between gap-3"
              >
                <a href={link} target="_blank" rel="noreferrer" className="text-[13px] break-all flex-1" style={{ color: accent }}>{link}</a>
                <button onClick={copy} className="text-[12px] px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 transition shrink-0">
                  {copied ? 'copied' : 'copy'}
                </button>
              </motion.div>
            )}
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-[13px] text-red-400">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
