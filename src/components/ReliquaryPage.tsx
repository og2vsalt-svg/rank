import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';
import { shareUrls } from '../lib/cloudShare';

export default function ReliquaryPage() {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState<string | null>(null);
  const [id, setId] = useState('');
  const [copied, setCopied] = useState('');

  const send = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    setWarn(file.size > 40 * 1024 * 1024 ? 'large drop. this can feel slow, nothing is blocked.' : null);
    const res = await publishLocalFile(file, { caption, author });
    setBusy(false);
    if (!res.ok || !res.id) {
      setErr(res.error || 'could not write the share');
      return;
    }
    setId(res.id);
    setWarn(res.warn || null);
  };

  const urls = id ? shareUrls(id) : null;

  const copy = async (label: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(''), 1200);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">reliquary</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">put a local file in the share table</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">
            The bytes go into the shares bucket. The row lands in public_shares. Paste the /s link in Discord and the card uses the file name, size, and image when there is one.
          </p>
        </motion.div>

        <label className="glass mt-8 block cursor-pointer rounded-3xl p-8 text-center">
          <input className="hidden" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <div className="text-[15px] text-white/80">{file ? file.name : 'choose a file from this machine'}</div>
          <div className="mt-1 text-[12px] text-white/40">{file ? `${(file.size / 1024).toFixed(1)} kb · no cap, just a warning if it is heavy` : 'any type'}</div>
        </label>

        <div className="mt-4 grid gap-3">
          <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="caption for the discord card" className="glass rounded-2xl px-4 py-3 text-[14px] outline-none" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="name on the card, optional" className="glass rounded-2xl px-4 py-3 text-[14px] outline-none" />
        </div>

        <button onClick={send} disabled={!file || busy} className="mt-4 w-full rounded-full bg-[#0A84FF] px-4 py-3 text-[15px] font-medium text-white disabled:opacity-40">
          {busy ? 'sending…' : 'upload to the database'}
        </button>
        {warn && <p className="mt-3 text-[13px] text-amber-200/80">{warn}</p>}
        {err && <p className="mt-3 text-[13px] text-red-300">{err}</p>}

        {urls && (
          <div className="glass mt-6 rounded-3xl p-5">
            <p className="text-[13px] text-white/50">discord card</p>
            <p className="mt-1 break-all text-[15px]">{urls.embed}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => copy('card', urls.embed)} className="rounded-full bg-white/10 px-3 py-1.5 text-[13px]">{copied === 'card' ? 'copied' : 'copy /s link'}</button>
              <button onClick={() => copy('app', urls.app)} className="rounded-full bg-white/10 px-3 py-1.5 text-[13px]">{copied === 'app' ? 'copied' : 'copy app link'}</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
