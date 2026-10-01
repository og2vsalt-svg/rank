import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

const accents = ['#0A84FF', '#30D158', '#FF9F0A', '#FF375F', '#BF5AF2', '#64D2FF'];

export default function CrosstreePage() {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [author, setAuthor] = useState('');
  const [color, setColor] = useState(accents[0]);
  const [busy, setBusy] = useState(false);
  const [embed, setEmbed] = useState('');
  const [warn, setWarn] = useState<string | null>(null);
  const [error, setError] = useState('');

  const send = async () => {
    if (!file) return;
    setBusy(true);
    setError('');
    const res = await publishLocalFile(file, { caption, author, color });
    setBusy(false);
    setWarn(res.warn || null);
    if (!res.ok || !res.id) {
      setError(res.error || 'could not file it');
      return;
    }
    setEmbed(shareUrls(res.id).embed);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">crosstree</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">a still with a colour on the card</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">
            The file goes to the shares bucket and public_shares. The accent is stored on the row so Discord’s unfurl picks up theme-color. Large files only warn.
          </p>
        </motion.div>
        <label className="glass mt-8 block cursor-pointer rounded-3xl p-8 text-center">
          <input className="hidden" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <div className="text-[15px] text-white/80">{file ? file.name : 'choose one local file'}</div>
        </label>
        <div className="mt-4 flex gap-2">
          {accents.map((c) => (
            <button key={c} onClick={() => setColor(c)} className="h-8 w-8 rounded-full" style={{ background: c, outline: color === c ? '2px solid white' : 'none', outlineOffset: 2 }} aria-label={c} />
          ))}
        </div>
        <div className="mt-4 grid gap-3">
          <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="caption on the card" className="glass rounded-2xl px-4 py-3 text-[14px] outline-none" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="name, optional" className="glass rounded-2xl px-4 py-3 text-[14px] outline-none" />
        </div>
        {file && file.size > 40 * 1024 * 1024 && <p className="mt-3 text-[13px] text-amber-200/80">large file. the send may feel slow. it is not refused.</p>}
        <button onClick={send} disabled={!file || busy} className="mt-4 w-full rounded-full bg-[#0A84FF] px-4 py-3 text-[15px] font-medium text-white disabled:opacity-40">
          {busy ? 'hoisting…' : 'publish the card'}
        </button>
        {error && <p className="mt-3 text-[13px] text-red-300">{error}</p>}
        {warn && <p className="mt-3 text-[13px] text-amber-200/80">{warn}</p>}
        {embed && (
          <div className="glass mt-5 rounded-2xl px-4 py-3">
            <p className="text-[12px] uppercase tracking-[0.14em] text-white/40">discord link</p>
            <p className="mt-1 break-all text-[14px]">{embed}</p>
            <button onClick={() => navigator.clipboard.writeText(embed)} className="mt-3 rounded-full bg-white/10 px-3 py-1 text-[12px]">copy</button>
          </div>
        )}
      </main>
    </div>
  );
}
