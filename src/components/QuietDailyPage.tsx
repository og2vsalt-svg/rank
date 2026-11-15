import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function QuietDailyPage() {
  const [date, setDate] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [accent, setAccent] = useState('#30D158');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const d = new Date();
    setDate(d.toISOString().slice(0, 10));
  }, []);

  const onText = (v: string) => {
    setBody(v);
    setWarn(v.length > 4000 ? 'Long entry. May feel a little slow. No hard limit.' : null);
  };

  const publish = async () => {
    if (!body.trim() && !file) return setErr('write a note or attach a file');
    setBusy(true);
    setErr('');
    setLink(null);
    try {
      const caption = `${date} · ${title.trim() || 'quiet daily'}`;
      let res;
      if (file) {
        res = await publishLocalFile(file, {
          caption,
          color: accent,
          cardTitle: title.trim() || file.name,
          meta: { desk: 'quietdaily', kind: 'dated', date },
        });
      } else {
        const name = `${date}-daily.txt`;
        const textFile = new File([body], name, { type: 'text/plain' });
        res = await publishLocalFile(textFile, {
          caption,
          color: accent,
          cardTitle: title.trim() || name,
          meta: { desk: 'quietdaily', kind: 'dated-text', date },
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
          initial={{ opacity: 0, y: 14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 105, damping: 19 }}
          className="glass rounded-[32px] p-8 md:p-10 shadow-2xl"
        >
          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>Quiet Daily</p>
          <h1 className="text-[32px] font-semibold tracking-tight mb-2">A still entry for the day.</h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed mb-8">
            Date a quiet note or attach a local file. It settles into the database with a polished Discord embed. Soft size warnings only. No hard limits. Apple-style springs and frosted glass. Prior desks remain fully intact. No traces of boosting.
          </p>

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-3 text-[15px] text-white mb-4 focus:outline-none focus:border-white/25"
          />

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Optional title"
            className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-4 focus:outline-none focus:border-white/25"
          />

          <textarea
            value={body}
            onChange={(e) => onText(e.target.value)}
            placeholder="Today’s quiet note…"
            rows={8}
            className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-4 resize-y min-h-[180px] focus:outline-none focus:border-white/25 font-mono text-[14px]"
          />

          <label className="block mb-4">
            <span className="text-[13px] text-neutral-400 mb-2 block">Optional local file</span>
            <input
              type="file"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setFile(f);
                if (f && f.size > 25 * 1024 * 1024) setWarn('Large file. May feel slow. No hard limit.');
                else setWarn(null);
              }}
              className="w-full text-[13px] text-neutral-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[13px] file:bg-white/10 file:text-white"
            />
            {file && <p className="text-[12px] text-neutral-500 mt-1">{file.name}</p>}
          </label>

          <div className="flex items-center gap-3 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0 bg-transparent" />
            <span className="text-[13px] text-neutral-400">Accent</span>
          </div>

          {warn && <p className="text-[13px] text-amber-300/90 mb-4">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            onClick={publish}
            disabled={busy || (!body.trim() && !file)}
            className="w-full rounded-2xl py-3.5 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-lg"
            style={{ background: accent }}
          >
            {busy ? 'Settling the day…' : 'Publish daily entry'}
          </motion.button>

          <AnimatePresence>
            {link && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 glass rounded-2xl p-4 flex items-center justify-between gap-3">
                <a href={link} target="_blank" rel="noreferrer" className="text-[13px] break-all flex-1" style={{ color: accent }}>{link}</a>
                <button onClick={copy} className="text-[12px] px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 shrink-0">
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
