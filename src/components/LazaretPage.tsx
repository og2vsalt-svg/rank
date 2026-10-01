import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function LazaretPage() {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [author, setAuthor] = useState('');
  const [color, setColor] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [embed, setEmbed] = useState('');
  const [copied, setCopied] = useState(false);

  const onFile = (next: File | null) => {
    setFile(next);
    setEmbed('');
    setError('');
    setWarn(next && next.size > 40 * 1024 * 1024 ? 'large file. nothing is blocked — the send may just feel slow.' : null);
  };

  const send = async () => {
    if (!file) return;
    setBusy(true);
    setError('');
    const res = await publishLocalFile(file, { caption, author, color });
    setBusy(false);
    if (!res.ok || !res.id) {
      setError(res.error || 'the handoff did not land');
      return;
    }
    setWarn(res.warn || warn);
    setEmbed(res.embed || shareUrls(res.id).embed);
    setFile(null);
  };

  const copy = async () => {
    if (!embed) return;
    await navigator.clipboard.writeText(embed);
    setCopied(true);
    setTimeout(() => setCopied(false), 1100);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">lazaret</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">hand a local file across</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">Pick something on this machine. It goes into the share database and comes back as a Discord card. No size cap — only a heads-up if the browser will work for it.</p>
        </motion.div>
        <motion.label initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.06, duration: 0.5 }} className="glass mt-8 flex cursor-pointer flex-col items-center rounded-3xl px-6 py-12 text-center">
          <input type="file" className="sr-only" onChange={(e) => onFile(e.target.files?.[0] || null)} />
          <span className="text-[17px] font-medium">{file ? file.name : 'choose a file'}</span>
          <span className="mt-1 text-[13px] text-white/45">{file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : 'anything local'}</span>
        </motion.label>
        <div className="glass mt-3 rounded-3xl p-5">
          <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="caption on the card" className="w-full rounded-2xl bg-black/30 px-4 py-3 text-[15px] outline-none placeholder:text-white/30" />
          <div className="mt-3 grid grid-cols-[1fr_auto] gap-3">
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="from" className="rounded-2xl bg-black/30 px-4 py-3 text-[15px] outline-none placeholder:text-white/30" />
            <input aria-label="card colour" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-12 w-14 rounded-2xl bg-transparent" />
          </div>
          <button onClick={send} disabled={!file || busy} className="mt-4 rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-black disabled:opacity-50">{busy ? 'sending…' : 'hand it over'}</button>
          {warn && <p className="mt-3 text-[13px] text-amber-200/80">{warn}</p>}
          {error && <p className="mt-3 text-[13px] text-red-300/90">{error}</p>}
          {embed && (
            <button onClick={copy} className="mt-3 block w-full truncate rounded-2xl bg-white/8 px-4 py-3 text-left text-[13px] text-white/70">{copied ? 'copied' : embed}</button>
          )}
        </div>
      </main>
    </div>
  );
}
