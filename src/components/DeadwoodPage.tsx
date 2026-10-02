import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

async function sha256(file: File) {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function DeadwoodPage() {
  const [file, setFile] = useState<File | null>(null);
  const [expect, setExpect] = useState('');
  const [hash, setHash] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [id, setId] = useState('');
  const [copied, setCopied] = useState(false);

  const slow = useMemo(() => (file && file.size > 12 * 1024 * 1024 ? 'large file. hashing stays in the tab and may feel slow. nothing is refused.' : null), [file]);
  const expected = expect.trim().toLowerCase().replace(/\s+/g, '');
  const match = hash && expected ? hash === expected : null;

  const check = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    setHash('');
    setId('');
    try {
      setHash(await sha256(file));
    } catch (e: any) {
      setErr(e?.message || 'could not hash that file');
    }
    setBusy(false);
  };

  const fileReceipt = async () => {
    if (!file || !hash) return;
    setBusy(true);
    setErr('');
    const body = [
      `# deadwood receipt`,
      '',
      `file: ${file.name}`,
      `size: ${file.size}`,
      `sha-256: ${hash}`,
      expected ? `expected: ${expected}` : 'expected: (none pasted)',
      `result: ${match === null ? 'measured only' : match ? 'match' : 'different'}`,
      '',
    ].join('\n');
    const receipt = new File([body], `${file.name}.sha256.txt`, { type: 'text/plain' });
    const res = await publishLocalFile(receipt, {
      cardTitle: match === false ? `${file.name} — different` : `${file.name} — receipt`,
      caption: match === null ? hash.slice(0, 16) : match ? 'sha-256 matches' : 'sha-256 does not match',
      author: 'deadwood',
      color: match === false ? '#FF453A' : '#30D158',
    });
    setBusy(false);
    if (!res.ok || !res.id) {
      setErr(res.error || 'the share table did not take the receipt');
      return;
    }
    setId(res.id);
  };

  const embed = id ? shareUrls(id).embed : '';

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-24 pb-20">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] tracking-[0.16em] uppercase text-white/45">proof desk</p>
          <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">deadwood</h1>
          <p className="mt-3 text-neutral-400 max-w-xl leading-relaxed">
            Hash a local file in the tab, compare it with a pasted digest if you have one, then file only the receipt. The original stays on your machine. Discord unfurls the card.
          </p>
        </motion.div>

        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="glass mt-8 rounded-3xl p-5 sm:p-6">
          <label className="block rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-8 text-center cursor-pointer">
            <input type="file" className="sr-only" onChange={(e) => { setFile(e.target.files?.[0] || null); setHash(''); setId(''); }} />
            <span className="text-sm text-neutral-200">{file ? file.name : 'choose a local file'}</span>
            <span className="block mt-1 text-xs text-white/40">{file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : 'hashed here, not uploaded'}</span>
          </label>
          {slow && <p className="mt-3 text-sm text-amber-200/90">{slow}</p>}
          <textarea value={expect} onChange={(e) => setExpect(e.target.value)} placeholder="optional sha-256 to compare" rows={2} className="mt-4 w-full rounded-2xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm font-mono outline-none focus:border-white/25" />
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={check} disabled={!file || busy} className="rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium disabled:opacity-40">{busy && !hash ? 'hashing…' : 'measure'}</button>
            <button onClick={fileReceipt} disabled={!hash || busy} className="rounded-full bg-white/10 text-white px-5 py-2.5 text-sm font-medium disabled:opacity-40">file the receipt</button>
          </div>
          {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
          {hash && (
            <div className="mt-4 rounded-2xl bg-black/30 border border-white/10 px-3.5 py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-white/40">{match === null ? 'measured' : match ? 'match' : 'different'}</p>
              <p className="mt-1 text-sm font-mono break-all text-neutral-200">{hash}</p>
            </div>
          )}
          {embed && (
            <button onClick={async () => { await navigator.clipboard.writeText(embed); setCopied(true); window.setTimeout(() => setCopied(false), 1200); }} className="mt-3 w-full text-left rounded-2xl bg-white/5 px-3.5 py-2.5 border border-white/10 text-sm">
              {copied ? 'copied' : embed}
            </button>
          )}
        </motion.section>
      </main>
    </div>
  );
}
