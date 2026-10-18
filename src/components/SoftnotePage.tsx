import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

export default function SoftnotePage() {
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [color, setColor] = useState('#F472B6');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ embed?: string; error?: string } | null>(null);
  const [copied, setCopied] = useState('');

  const send = async () => {
    if (!note.trim()) return;
    setBusy(true);
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    const blob = new Blob([note], { type: 'text/plain' });
    const dataUrl = await new Promise<string>((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.readAsDataURL(blob);
    });
    const res = await publishShare({
      id,
      name: note.slice(0, 64) || 'quiet note',
      type: 'text/plain',
      size: blob.size,
      dataUrl,
      author,
      caption: note.slice(0, 320),
    });
    setResult(res.ok && res.id ? { embed: shareUrls(res.id).embed } : { error: res.error || 'could not file the note' });
    setBusy(false);
  };

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(value);
    setTimeout(() => setCopied(''), 1200);
  };

  return (
    <div className="mesh min-h-screen relative overflow-hidden">
      <Navbar />
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ background: color, opacity: 0.18 }}
        animate={{ scale: [1, 1.25, 1], opacity: [0.12, 0.28, 0.14] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <main className="mx-auto max-w-xl px-5 pb-24 pt-12 relative">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 100, damping: 22 }}>
          <p className="text-[12px] uppercase tracking-[0.18em] text-white/40">softnote</p>
          <h1 className="mt-2 text-[36px] font-semibold tracking-[-0.045em]">soft note</h1>
          <p className="mt-3 text-[15.5px] leading-relaxed text-white/65">
            A pure text note that travels alone. No file required. Soft pulsing light, spring-loaded glass, and a professional Discord embed on the share link. Lands in the public_shares table. Large notes only warned for possible slowness. No hard limits. Prior desks preserved. No traces of boosting.
          </p>
        </motion.div>

        <div className="glass mt-8 rounded-[28px] p-6">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="write a quiet note…"
            className="w-full min-h-[140px] bg-transparent text-[15.5px] leading-relaxed outline-none placeholder:text-white/35"
          />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="name, optional"
              className="glass rounded-2xl px-4 py-2.5 text-[14px] outline-none flex-1 min-w-[140px]"
            />
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded-xl border border-white/10 bg-transparent"
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            onClick={send}
            disabled={!note.trim() || busy}
            className="mt-4 w-full rounded-full px-5 py-3 text-[15px] font-medium text-white disabled:opacity-40"
            style={{ background: color }}
          >
            {busy ? 'filing…' : 'file the note'}
          </motion.button>
        </div>

        {result?.embed && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 glass rounded-2xl px-4 py-3.5"
          >
            <div className="flex items-center justify-between gap-3 text-[13px]">
              <p className="break-all text-white/60">{result.embed}</p>
              <button onClick={() => copy(result.embed!)} className="shrink-0 rounded-full bg-white/10 px-3 py-1">
                {copied === result.embed ? 'copied' : 'copy'}
              </button>
            </div>
          </motion.div>
        )}
        {result?.error && <p className="mt-3 text-[13px] text-red-300">{result.error}</p>}
      </main>
    </div>
  );
}
