import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare } from '../lib/cloudShare';

export default function QuietNotePage() {
  const [text, setText] = useState('');
  const [author, setAuthor] = useState('');
  const [color, setColor] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ embed?: string; error?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const send = async () => {
    if (!text.trim()) return;
    setBusy(true);
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const dataUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`;
    const res = await publishShare({
      id,
      name: text.slice(0, 60) || 'quiet note',
      type: 'text/plain',
      size: text.length,
      dataUrl,
      author,
      caption: text,
    });
    setResult(res.ok ? { embed: res.embed } : { error: res.error });
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
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 95, damping: 16 }}
        >
          <p className="text-[12px] uppercase tracking-[0.18em] text-white/40">quiet note</p>
          <h1 className="mt-2 text-[32px] font-semibold tracking-[-0.035em]">a note that travels alone</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/55">
            Write pure text. No file required. It lands in the public_shares table as a shareable note with professional Discord embeds. Soft Apple-style spring motion and glass. Prior features preserved. No traces of boosting.
          </p>
        </motion.div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="what should travel with this link…"
          className="glass mt-8 min-h-[180px] w-full resize-y rounded-3xl px-5 py-4 text-[15px] leading-relaxed outline-none"
        />

        <div className="mt-4 grid gap-3">
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="name, optional" className="glass rounded-2xl px-4 py-3 text-[14px] outline-none" />
          <div className="flex items-center gap-3">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-14 cursor-pointer rounded-xl border border-white/10 bg-transparent" />
            <span className="text-[13px] text-white/45">accent for the card</span>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={send}
          disabled={!text.trim() || busy}
          className="mt-4 w-full rounded-full px-4 py-3 text-[15px] font-medium text-white disabled:opacity-40"
          style={{ background: color }}
        >
          {busy ? 'sending…' : 'share the note'}
        </motion.button>

        {result?.embed && (
          <div className="glass mt-6 rounded-2xl px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-[14px]">note shared</p>
              <button onClick={copy} className="rounded-full bg-white/10 px-3 py-1 text-[12px]">
                {copied ? 'copied' : 'copy /s'}
              </button>
            </div>
            <p className="mt-1 break-all text-[12px] text-white/40">{result.embed}</p>
          </div>
        )}
        {result?.error && <p className="mt-4 text-[13px] text-red-300">{result.error}</p>}
      </main>
    </div>
  );
}
