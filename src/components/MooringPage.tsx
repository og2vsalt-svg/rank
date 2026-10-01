import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function MooringPage() {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [author, setAuthor] = useState('');
  const [color, setColor] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [embed, setEmbed] = useState('');
  const [error, setError] = useState('');
  const [warn, setWarn] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const preview = useMemo(() => {
    if (!file) return '';
    const mb = file.size / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`;
  }, [file]);

  const send = async () => {
    if (!file) return;
    setBusy(true);
    setError('');
    setCopied(false);
    const res = await publishLocalFile(file, { caption: caption.trim().slice(0, 180), author: author.trim(), color });
    setBusy(false);
    if (!res.ok || !res.id) {
      setError(res.error || 'the file did not land');
      return;
    }
    setWarn(res.warn || (file.size > 12 * 1024 * 1024 ? 'large drop. the send may feel slow. nothing is blocked.' : null));
    setEmbed(res.embed || '');
  };

  const copy = async () => {
    if (!embed) return;
    await navigator.clipboard.writeText(embed);
    setCopied(true);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">mooring</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">tie a local file to the quay</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">Pick something from this machine. It goes into the share database, then Discord unfurls /s with the caption and accent you set. No size ceiling — only a note if the tab may feel slow.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.5 }} className="glass mt-8 rounded-3xl p-5">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-black/25 px-4 py-10 text-center transition hover:border-white/30">
            <span className="text-[15px] text-white">{file ? file.name : 'choose a file'}</span>
            <span className="mt-1 text-[13px] text-white/45">{file ? preview : 'anything on this device'}</span>
            <input type="file" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="caption for the discord card" className="mt-3 w-full rounded-2xl bg-black/30 px-4 py-3 text-[15px] outline-none placeholder:text-white/30" />
          <div className="mt-3 flex gap-3">
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="from" className="min-w-0 flex-1 rounded-2xl bg-black/30 px-4 py-3 text-[15px] outline-none placeholder:text-white/30" />
            <label className="flex items-center gap-2 rounded-2xl bg-black/30 px-3">
              <span className="text-[12px] text-white/45">accent</span>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-8 cursor-pointer bg-transparent" />
            </label>
          </div>
          <button onClick={send} disabled={!file || busy} className="mt-4 rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-black transition hover:bg-neutral-200 disabled:opacity-50">{busy ? 'tying…' : 'moor it'}</button>
          {warn && <p className="mt-3 text-[13px] text-amber-200/80">{warn}</p>}
          {error && <p className="mt-3 text-[13px] text-red-300/90">{error}</p>}
          {embed && (
            <div className="mt-4 flex items-center gap-2">
              <p className="min-w-0 flex-1 truncate text-[13px] text-white/70">{embed}</p>
              <button onClick={copy} className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-[12px] text-white">{copied ? 'copied' : 'copy'}</button>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
