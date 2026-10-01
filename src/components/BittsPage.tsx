import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

async function fingerprint(file: File) {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function BittsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState('');
  const [busyHash, setBusyHash] = useState(false);
  const [busy, setBusy] = useState(false);
  const [embed, setEmbed] = useState('');
  const [error, setError] = useState('');
  const [warn, setWarn] = useState<string | null>(null);
  const [copied, setCopied] = useState('');

  const read = async (next: File | null) => {
    setFile(next);
    setHash('');
    setEmbed('');
    setError('');
    setWarn(next && next.size > 24 * 1024 * 1024 ? 'large file. hashing stays in this tab and may feel slow. it is not blocked.' : null);
    if (!next) return;
    setBusyHash(true);
    try {
      setHash(await fingerprint(next));
    } catch {
      setError('could not read that file in the browser');
    } finally {
      setBusyHash(false);
    }
  };

  const send = async () => {
    if (!file || !hash) return;
    setBusy(true);
    setError('');
    const res = await publishLocalFile(file, {
      caption: `sha256 ${hash.slice(0, 16)}…`,
      color: '#30D158',
    });
    setBusy(false);
    if (!res.ok || !res.id) {
      setError(res.error || 'the receipt did not land');
      return;
    }
    setEmbed(res.embed || '');
    setWarn(res.warn || warn);
  };

  const copy = async (which: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(which);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">bitts</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">a receipt, not a cabinet</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">The fingerprint is made here, before anything leaves. If you publish, the file goes into the share database and Discord’s card carries the short digest.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.5 }} className="glass mt-8 rounded-3xl p-5">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-black/25 px-4 py-10 text-center transition hover:border-white/30">
            <span className="text-[15px] text-white">{file ? file.name : 'choose a file to mark'}</span>
            <span className="mt-1 text-[13px] text-white/45">{busyHash ? 'reading…' : 'sha-256 stays on this machine until you publish'}</span>
            <input type="file" className="sr-only" onChange={(e) => read(e.target.files?.[0] || null)} />
          </label>
          {hash && (
            <button onClick={() => copy('hash', hash)} className="mt-3 w-full break-all rounded-2xl bg-black/30 px-4 py-3 text-left font-mono text-[12px] leading-relaxed text-white/75">{hash}</button>
          )}
          <button onClick={send} disabled={!file || !hash || busy} className="mt-4 rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-black transition hover:bg-neutral-200 disabled:opacity-50">{busy ? 'belaying…' : 'publish with receipt'}</button>
          {warn && <p className="mt-3 text-[13px] text-amber-200/80">{warn}</p>}
          {error && <p className="mt-3 text-[13px] text-red-300/90">{error}</p>}
          {embed && (
            <div className="mt-4 flex items-center gap-2">
              <p className="min-w-0 flex-1 truncate text-[13px] text-white/70">{embed}</p>
              <button onClick={() => copy('card', embed)} className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-[12px] text-white">{copied === 'card' ? 'copied' : 'copy'}</button>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
