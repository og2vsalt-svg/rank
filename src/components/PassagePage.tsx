import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function seconds(bytes: number, mbps: number) {
  const bits = bytes * 8;
  const rate = mbps * 1_000_000;
  return bits / rate;
}

export default function PassagePage() {
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const rates = [5, 20, 80];
  const estimate = useMemo(() => {
    if (!file) return [];
    return rates.map((mbps) => ({ mbps, secs: seconds(file.size, mbps) }));
  }, [file]);

  const send = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    const res = await publishLocalFile(file, { caption: 'timed on passage', cardTitle: file.name });
    setBusy(false);
    if (!res.ok || !res.id) {
      setErr(res.error || 'send failed');
      return;
    }
    setLink(`${location.origin}/s/${res.id}`);
    setWarn(res.warn || (file.size > 40 * 1024 * 1024 ? 'large file. warned, not blocked.' : ''));
  };

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] tracking-[0.16em] uppercase text-white/40">timing desk</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="mt-2 text-4xl font-semibold tracking-tight">Passage</motion.h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/60">A stopwatch for a local file, not a cabinet. It guesses how long a send might take, then can still file the bytes if you want a Discord link. Nothing is turned away for being large.</p>
        <label className="mt-8 flex cursor-pointer flex-col items-center rounded-3xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-12 text-center transition duration-200 hover:border-[#0a84ff]/50">
          <span className="text-sm">{file ? file.name : 'drop a local file here to time it'}</span>
          <span className="mt-1 text-xs text-white/40">{file ? pretty(file.size) : 'read locally first'}</span>
          <input type="file" className="hidden" onChange={(e) => { setFile(e.target.files?.[0] || null); setLink(''); setWarn(''); }} />
        </label>
        {!!estimate.length && (
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {estimate.map((row) => (
              <motion.div key={row.mbps} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs text-white/40">{row.mbps} Mbps</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight">{row.secs < 90 ? `${Math.max(1, Math.round(row.secs))}s` : `${(row.secs / 60).toFixed(1)} min`}</p>
              </motion.div>
            ))}
          </div>
        )}
        {file && file.size > 80 * 1024 * 1024 && <p className="mt-3 text-xs text-amber-200/80">over 80 MB. the browser may pause. still no cap.</p>}
        <button disabled={!file || busy} onClick={send} className="mt-5 rounded-full bg-[#0a84ff] px-5 py-2.5 text-sm font-medium text-white transition duration-200 hover:scale-[1.02] disabled:opacity-40">{busy ? 'sending…' : 'file this passage'}</button>
        {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
        {warn && <p className="mt-3 text-sm text-amber-200/80">{warn}</p>}
        {link && <button onClick={() => navigator.clipboard.writeText(link)} className="mt-3 block text-left text-sm text-[#7ab6ff]">{link}</button>}
      </main>
    </div>
  );
}
