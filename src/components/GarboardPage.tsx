import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

async function fingerprint(file: File) {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export default function GarboardPage() {
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState<string | null>(null);
  const [id, setId] = useState('');

  const stamp = async (f: File) => {
    setFile(f);
    setHash('');
    setId('');
    setErr('');
    setWarn(f.size > 12 * 1024 * 1024 ? 'reading a large file in the tab can feel slow. nothing is capped.' : null);
    try {
      setHash(await fingerprint(f));
    } catch {
      setErr('could not read that file in this browser');
    }
  };

  const publish = async () => {
    if (!file || !hash) return;
    setBusy(true);
    setErr('');
    const res = await publishLocalFile(file, { caption: `sha256 ${hash.slice(0, 16)}` });
    setBusy(false);
    if (!res.ok || !res.id) {
      setErr(res.error || 'could not land the file');
      return;
    }
    setId(res.id);
    setWarn(res.warn || warn);
  };

  const urls = id ? shareUrls(id) : null;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">garboard</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">stamp a local before it leaves</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">
            The hash stays in the tab until you publish. Then the original file lands in the share database, and Discord gets the /s card.
          </p>
        </motion.div>
        <label className="glass mt-8 block cursor-pointer rounded-3xl px-4 py-10 text-center text-[14px] text-white/70 transition-transform active:scale-[0.99]">
          {file ? file.name : 'choose a local file'}
          <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && stamp(e.target.files[0])} />
        </label>
        {hash && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 break-all font-mono text-[12px] leading-relaxed text-white/55">
            {hash}
          </motion.p>
        )}
        {warn && <p className="mt-3 text-[13px] text-amber-200">{warn}</p>}
        <button onClick={publish} disabled={busy || !hash} className="mt-5 rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-black transition-transform active:scale-[0.98] disabled:opacity-50">
          {busy ? 'sending…' : 'publish stamped file'}
        </button>
        {err && <p className="mt-3 text-[13px] text-red-300">{err}</p>}
        {urls && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass mt-5 rounded-3xl p-5">
            <p className="text-[13px] text-white/50">discord card</p>
            <p className="mt-1 break-all text-[14px]">{urls.embed}</p>
          </motion.div>
        )}
      </main>
    </div>
  );
}
