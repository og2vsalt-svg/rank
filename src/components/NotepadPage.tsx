import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function NotepadPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [author, setAuthor] = useState('');
  const [color, setColor] = useState('#FF9F0A');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ embed?: string; error?: string; warn?: string | null } | null>(null);
  const [copied, setCopied] = useState(false);

  const share = async () => {
    if (!body.trim()) return;
    setBusy(true);
    setResult(null);
    const text = title ? `${title}\n\n${body}` : body;
    const blob = new Blob([text], { type: 'text/plain' });
    const file = new File([blob], `${(title || 'note').replace(/[^a-z0-9._-]+/gi, '_') || 'note'}.txt`, { type: 'text/plain' });
    const res = await publishLocalFile(file, {
      author,
      caption: title || body.slice(0, 140),
      color,
      cardTitle: title || 'untitled note',
      meta: { accent: color, source: 'notepad', kind: 'note' },
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
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 110, damping: 22 }}>
          <p className="text-[12px] uppercase tracking-[0.18em] text-white/40">notepad</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">write a note. share it quietly.</h1>
          <p className="mt-3 text-[15.5px] leading-relaxed text-white/65">
            A clean Apple Notes surface. Your text becomes a file in storage and a row in public_shares. Every link unfurls a polished Discord card. No hard limits — only a soft warning if the note is unusually long. Prior desks stay intact.
          </p>
        </motion.div>

        <div className="mt-8 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="title (optional)"
            className="glass w-full rounded-2xl px-4 py-3.5 text-[15px] outline-none"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="write freely…"
            rows={12}
            className="glass w-full resize-none rounded-[24px] px-4 py-4 text-[15px] leading-relaxed outline-none"
          />
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="name, optional"
            className="glass w-full rounded-2xl px-4 py-3.5 text-[14px] outline-none"
          />
          <div className="flex items-center gap-3">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-11 w-16 cursor-pointer rounded-xl border border-white/10 bg-transparent" />
            <span className="text-[13px] text-white/50">accent for the card</span>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.965 }}
          whileHover={{ scale: 1.012 }}
          onClick={share}
          disabled={!body.trim() || busy}
          className="mt-6 w-full rounded-full px-4 py-3.5 text-[15px] font-medium text-black disabled:opacity-40"
          style={{ background: color }}
        >
          {busy ? 'filing the note…' : 'share the note'}
        </motion.button>

        {result && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass mt-6 rounded-2xl px-4 py-4">
            {result.embed ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[14px]">note filed</p>
                  <button onClick={copy} className="rounded-full bg-white/10 px-3 py-1 text-[12px]">
                    {copied ? 'copied' : 'copy link'}
                  </button>
                </div>
                <p className="mt-2 break-all text-[12px] text-white/45">{result.embed}</p>
              </>
            ) : (
              <p className="text-[13px] text-red-300">{result.error || 'could not file the note'}</p>
            )}
            {result.warn && <p className="mt-2 text-[12px] text-amber-200/80">{result.warn}</p>}
          </motion.div>
        )}
      </main>
    </div>
  );
}
