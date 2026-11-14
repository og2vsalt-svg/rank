import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function QuietPastePage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const onText = (v: string) => {
    setBody(v);
    const bytes = new Blob([v]).size;
    setWarn(bytes > 200_000 ? 'Long paste. Upload may feel a little slow. No hard limit.' : null);
  };

  const publish = async () => {
    if (!body.trim()) return setErr('write something to share');
    setBusy(true);
    setErr('');
    setLink(null);
    try {
      const name = (title.trim() || 'paste') + '.txt';
      const file = new File([body], name, { type: 'text/plain' });
      const res = await publishLocalFile(file, {
        caption: title.trim() || 'quiet paste',
        color: accent,
        cardTitle: title.trim() || name,
        meta: { desk: 'quietpaste', kind: 'text' },
      });
      if (res.ok && res.embed) setLink(res.embed);
      else setErr(res.error || 'could not publish');
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
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 110, damping: 22 }}
          className="glass rounded-[32px] p-8 md:p-10 shadow-2xl"
        >
          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>Quiet Paste</p>
          <h1 className="text-[32px] font-semibold tracking-tight mb-2">Share plain text.</h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed mb-8">
            A still surface for notes, snippets, or messages. They become a quiet text file in the database. Every link unfurls a polished Discord embed. Soft warnings only for long pastes. No hard limits. Apple-style springs and frosted glass. Prior desks stay untouched.
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
            placeholder="Paste or type anything…"
            rows={12}
            className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-4 resize-y min-h-[220px] focus:outline-none focus:border-white/25 transition font-mono text-[14px] leading-relaxed"
          />

          <div className="flex items-center gap-4 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0 bg-transparent" />
            <span className="text-[13px] text-neutral-400">Accent for the embed</span>
          </div>

          {warn && <p className="text-[13px] text-amber-300/90 mb-4">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.015 }}
            onClick={publish}
            disabled={busy || !body.trim()}
            className="w-full rounded-2xl py-3.5 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-lg"
            style={{ background: accent }}
          >
            {busy ? 'Settling…' : 'Publish paste'}
          </motion.button>

          <AnimatePresence>
            {link && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 glass rounded-2xl p-4 flex items-center justify-between gap-3"
              >
                <a href={link} className="text-[13px] break-all flex-1" style={{ color: accent }}>{link}</a>
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
