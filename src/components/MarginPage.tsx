import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function MarginPage() {
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [embed, setEmbed] = useState('');
  const [copied, setCopied] = useState(false);

  const send = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    setWarn(file.size > 25 * 1024 * 1024 ? 'large file. the send may pause. it is not refused.' : '');
    const res = await publishLocalFile(file, {
      author,
      caption: note.slice(0, 240),
    });
    setBusy(false);
    if (!res.ok || !res.id) {
      setErr(res.error || 'could not file the margin');
      return;
    }
    setEmbed(shareUrls(res.id).embed);
    setWarn(res.warn || warn);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">margin</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">a note written in the margin</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">
            The file is the drop. The note becomes the Discord description, not a second vault. Paste /s and the card carries both the filename and what you wrote beside it.
          </p>
        </motion.div>

        <label className="glass mt-8 block cursor-pointer rounded-3xl p-8 text-center">
          <input className="hidden" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <div className="text-[15px] text-white/80">{file ? file.name : 'choose the file this note belongs to'}</div>
          <div className="mt-1 text-[12px] text-white/40">{file ? `${(file.size / 1024).toFixed(1)} kb` : 'any type'}</div>
        </label>

        <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="what should the card say" rows={5} className="glass mt-4 w-full resize-none rounded-3xl px-4 py-3 text-[14px] leading-relaxed outline-none" />
        <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="signed, optional" className="glass mt-3 w-full rounded-2xl px-4 py-3 text-[14px] outline-none" />

        <button onClick={send} disabled={!file || busy} className="mt-4 w-full rounded-full bg-[#0A84FF] px-4 py-3 text-[15px] font-medium text-white disabled:opacity-40">
          {busy ? 'filing…' : 'file the margin'}
        </button>
        {warn && <p className="mt-3 text-[13px] text-amber-200/80">{warn}</p>}
        {err && <p className="mt-3 text-[13px] text-red-300">{err}</p>}
        {embed && (
          <div className="glass mt-6 rounded-3xl p-5">
            <p className="text-[13px] text-white/50">discord card</p>
            <p className="mt-1 break-all text-[15px]">{embed}</p>
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(embed);
                setCopied(true);
                setTimeout(() => setCopied(false), 1200);
              }}
              className="mt-3 rounded-full bg-white/10 px-3 py-1.5 text-[13px]"
            >
              {copied ? 'copied' : 'copy /s link'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
