import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(2) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

async function sha256(file: File) {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function StampPage() {
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState('');
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');

  const onPick = async (list: FileList | null) => {
    const next = list?.[0];
    if (!next) return;
    setFile(next);
    setLink('');
    setErr('');
    setHash('reading…');
    setWarn(next.size > 40 * 1024 * 1024 ? 'heavy file. hashing and upload can feel slow. nothing is refused.' : '');
    try {
      setHash(await sha256(next));
    } catch {
      setHash('could not hash in this browser');
    }
  };

  const send = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    try {
      const res = await publishLocalFile(file, { caption: caption.trim() || undefined, author: 'stamp' });
      if (!res.ok || !res.id) {
        setErr(res.error || 'the share table did not take it');
        return;
      }
      if (res.warn) setWarn(res.warn);
      setLink(shareUrls(res.id).embed);
    } finally {
      setBusy(false);
    }
  };

  const meta = useMemo(() => {
    if (!file) return null;
    return [
      ['name', file.name],
      ['type', file.type || 'unknown'],
      ['size', pretty(file.size)],
      ['last touched', new Date(file.lastModified).toLocaleString()],
    ];
  }, [file]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-xl mx-auto px-5 pt-28 pb-24">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] tracking-[0.18em] uppercase text-white/40">stamp</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">fingerprint, then file it</h1>
          <p className="mt-2 text-sm text-white/55 leading-relaxed">Look at a local file before it leaves the tab. The hash stays here. Publishing writes the bytes into the share database and hands back a Discord card.</p>
          <label className="mt-8 flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-12 text-center cursor-pointer hover:bg-white/[0.05] transition-colors">
            <input type="file" className="sr-only" onChange={(e) => onPick(e.target.files)} />
            <span className="text-sm text-white/80">{file ? file.name : 'choose a file'}</span>
            <span className="mt-1 text-xs text-white/40">no size cap — large ones only warn</span>
          </label>
          {meta && (
            <dl className="mt-6 divide-y divide-white/8 rounded-2xl border border-white/8 bg-white/[0.03]">
              {meta.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 px-4 py-3 text-sm">
                  <dt className="text-white/40">{k}</dt>
                  <dd className="text-right break-all">{v}</dd>
                </div>
              ))}
              <div className="px-4 py-3 text-sm">
                <dt className="text-white/40">sha-256</dt>
                <dd className="mt-1 font-mono text-[12px] break-all text-white/80">{hash}</dd>
              </div>
            </dl>
          )}
          <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="caption for the discord card" className="mt-4 w-full rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/25" />
          {warn && <p className="mt-3 text-xs text-amber-200/80">{warn}</p>}
          {err && <p className="mt-3 text-xs text-red-300">{err}</p>}
          <button disabled={!file || busy} onClick={send} className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">{busy ? 'sending…' : 'publish to share db'}</button>
          {link && (
            <a href={link} className="mt-4 block text-sm text-sky-300 break-all">{link}</a>
          )}
        </motion.div>
      </main>
    </div>
  );
}
