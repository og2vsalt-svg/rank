import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function InboxPage() {
  const [file, setFile] = useState<File | null>(null);
  const [from, setFrom] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState<string | null>(null);
  const [id, setId] = useState('');
  const [copied, setCopied] = useState('');

  const send = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    setWarn(file.size > 40 * 1024 * 1024 ? 'heavy envelope. the browser may pause while it sends. nothing is blocked.' : null);
    const res = await publishLocalFile(file, {
      author: from || undefined,
      caption: note || undefined,
    });
    setBusy(false);
    if (!res.ok || !res.id) {
      setErr(res.error || 'the envelope did not land');
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
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">inbox</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">hand a local file to the share table</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">
            The file leaves this machine, lands in the shares bucket, and a row is written to public_shares. Paste /s in Discord for the card. No size ceiling, only a warning if the send will feel slow.
          </p>
        </motion.div>
        <label className="glass mt-8 block cursor-pointer rounded-3xl p-8 text-center">
          <input className="hidden" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <div className="text-[15px] text-white/80">{file ? file.name : 'choose a file on this device'}</div>
          <div className="mt-1 text-[12px] text-white/40">{file ? `${(file.size / 1024).toFixed(1)} kb` : 'any type, any size'}</div>
        </label>
        <div className="mt-4 grid gap-3">
          <input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="from, optional" className="glass rounded-2xl px-4 py-3 text-[14px] outline-none" />
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="note on the discord card" className="glass rounded-2xl px-4 py-3 text-[14px] outline-none" />
        </div>
        <button onClick={send} disabled={!file || busy} className="mt-4 w-full rounded-full bg-white px-4 py-3 text-[15px] font-medium text-black disabled:opacity-40">
          {busy ? 'sealing…' : 'send to the database'}
        </button>
        {warn && <p className="mt-3 text-[13px] text-amber-200/80">{warn}</p>}
        {err && <p className="mt-3 text-[13px] text-red-300">{err}</p>}
        {urls && (
          <div className="glass mt-6 rounded-3xl p-5">
            <p className="text-[13px] text-white/50">links with embeds</p>
            <p className="mt-2 break-all text-[14px]">{urls.embed}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => copy('s', urls.embed)} className="rounded-full bg-white/10 px-3 py-1.5 text-[13px]">{copied === 's' ? 'copied' : 'copy /s'}</button>
              <button onClick={() => copy('f', urls.file)} className="rounded-full bg-white/10 px-3 py-1.5 text-[13px]">{copied === 'f' ? 'copied' : 'copy /f'}</button>
              <button onClick={() => copy('open', urls.open)} className="rounded-full bg-white/10 px-3 py-1.5 text-[13px]">{copied === 'open' ? 'copied' : 'copy /open'}</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
