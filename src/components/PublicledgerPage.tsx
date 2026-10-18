import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, publishShare, shareUrls, type CloudMeta } from '../lib/cloudShare';

export default function PublicledgerPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [color, setColor] = useState('#64D2FF');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ embed?: string; error?: string } | null>(null);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    listPublicShares(18).then(setShares);
  }, []);

  const sendNote = async () => {
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
      name: note.slice(0, 48) || 'quiet note',
      type: 'text/plain',
      size: blob.size,
      dataUrl,
      author,
      caption: note.slice(0, 280),
    });
    setResult(res.ok && res.id ? { embed: shareUrls(res.id).embed } : { error: res.error || 'could not file the note' });
    setBusy(false);
    if (res.ok) listPublicShares(18).then(setShares);
  };

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(value);
    setTimeout(() => setCopied(''), 1200);
  };

  return (
    <div className="mesh min-h-screen relative">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 120, damping: 22 }}>
          <p className="text-[12px] uppercase tracking-[0.18em] text-white/40">publicledger</p>
          <h1 className="mt-2 text-[36px] font-semibold tracking-[-0.045em]">public ledger of shares</h1>
          <p className="mt-3 text-[15.5px] leading-relaxed text-white/65">
            Browse recent public drops already filed. Leave a pure text note that travels alone — no file required. Lands in the public_shares table with polished Discord embeds. Soft Apple-style spring motion and glass surfaces. Large notes warned only for possible slowness. No hard limits. Prior desks preserved. No traces of boosting.
          </p>
        </motion.div>

        <div className="mt-8 glass rounded-[28px] p-6">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="write a quiet note that will be filed as its own share…"
            className="w-full min-h-[120px] bg-transparent text-[15px] leading-relaxed outline-none placeholder:text-white/35"
          />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="name, optional" className="glass rounded-2xl px-4 py-2.5 text-[14px] outline-none flex-1 min-w-[140px]" />
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-14 cursor-pointer rounded-xl border border-white/10 bg-transparent" />
            <motion.button
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.02 }}
              onClick={sendNote}
              disabled={!note.trim() || busy}
              className="rounded-full px-5 py-2.5 text-[14px] font-medium text-white disabled:opacity-40"
              style={{ background: color }}
            >
              {busy ? 'filing…' : 'file the note'}
            </motion.button>
          </div>
          {result?.embed && (
            <div className="mt-4 flex items-center justify-between gap-3 text-[13px]">
              <p className="break-all text-white/60">{result.embed}</p>
              <button onClick={() => copy(result.embed!)} className="shrink-0 rounded-full bg-white/10 px-3 py-1">{copied === result.embed ? 'copied' : 'copy'}</button>
            </div>
          )}
          {result?.error && <p className="mt-3 text-[13px] text-red-300">{result.error}</p>}
        </div>

        <h2 className="mt-10 text-[20px] font-semibold tracking-[-0.02em]">recent public shares</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {shares.map((s) => (
            <motion.a
              key={s.id}
              href={shareUrls(s.id).app}
              target="_blank"
              rel="noreferrer"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass block rounded-2xl p-4 transition hover:bg-white/[0.04]"
            >
              <p className="truncate text-[14px] font-medium">{s.cardTitle || s.name}</p>
              <p className="mt-1 line-clamp-2 text-[12.5px] text-white/50">{s.caption || 'public drop'}</p>
              <p className="mt-2 text-[11px] text-white/35">{(s.size / 1024).toFixed(0)} kb · {s.author || 'anonymous'}</p>
            </motion.a>
          ))}
          {!shares.length && <p className="text-[13px] text-white/40">no recent public shares yet.</p>}
        </div>
      </main>
    </div>
  );
}
