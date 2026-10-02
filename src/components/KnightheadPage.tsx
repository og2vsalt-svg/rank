import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

async function sha256(file: File) {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function KnightheadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState('');
  const [embed, setEmbed] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');

  const weigh = async (next: File) => {
    setFile(next);
    setErr('');
    setWarn(next.size > 80 * 1024 * 1024 ? 'big file. hashing stays in this tab and may feel slow. no cap.' : '');
    setHash(await sha256(next));
  };

  const fileReceipt = async () => {
    if (!file || !hash) return;
    setBusy(true);
    setErr('');
    const body = `knighthead receipt\nname ${file.name}\nsize ${file.size}\nsha256 ${hash}\n`;
    const receipt = new File([body], `${file.name}.receipt.txt`, { type: 'text/plain' });
    const res = await publishLocalFile(receipt, { caption: `receipt · ${file.name}`, color: '#0A84FF' });
    setBusy(false);
    if (!res.ok) {
      setErr(res.error || 'receipt did not land');
      return;
    }
    setEmbed(res.embed || '');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] uppercase tracking-[0.16em] text-zinc-500">knighthead</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="mt-2 text-4xl font-semibold tracking-tight">A receipt, not the cargo.</motion.h1>
        <p className="mt-3 text-zinc-400">Hash a local file in the tab. Only the receipt text is written to the share database, so Discord can unfurl the proof.</p>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <label className="block cursor-pointer rounded-2xl border border-dashed border-white/15 px-4 py-8 text-center text-sm text-zinc-300">
            <input type="file" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) weigh(f); }} />
            {file ? file.name : 'choose a local file'}
          </label>
          {warn && <p className="mt-3 text-xs text-amber-200/90">{warn}</p>}
          {hash && <p className="mt-4 break-all font-mono text-xs text-zinc-300">{hash}</p>}
          <button disabled={!hash || busy} onClick={fileReceipt} className="mt-4 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black disabled:opacity-40">{busy ? 'filing…' : 'file the receipt'}</button>
          {err && <p className="mt-3 text-sm text-rose-300">{err}</p>}
          {embed && <a className="mt-3 block text-sm text-[#0A84FF]" href={embed}>{embed}</a>}
        </motion.div>
      </main>
    </div>
  );
}
