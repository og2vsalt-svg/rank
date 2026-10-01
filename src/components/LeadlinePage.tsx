import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

type Measure = { label: string; value: string };

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

async function measure(file: File): Promise<Measure[]> {
  const rows: Measure[] = [
    { label: 'name', value: file.name || 'untitled' },
    { label: 'kind', value: file.type || 'unknown' },
    { label: 'size', value: pretty(file.size) },
  ];
  const seconds = file.size / (2.5 * 1024 * 1024);
  rows.push({ label: 'feel', value: seconds < 2 ? 'should feel quick' : `about ${Math.ceil(seconds)}s on a modest link` });
  if (file.type.startsWith('image/')) {
    const url = URL.createObjectURL(file);
    const dims = await new Promise<string>((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve(`${img.naturalWidth} × ${img.naturalHeight}`);
        URL.revokeObjectURL(url);
      };
      img.onerror = () => {
        resolve('could not read');
        URL.revokeObjectURL(url);
      };
      img.src = url;
    });
    rows.push({ label: 'frame', value: dims });
  }
  return rows;
}

export default function LeadlinePage() {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Measure[]>([]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [embed, setEmbed] = useState('');
  const [error, setError] = useState('');
  const [warn, setWarn] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const take = async (next: File | null) => {
    setFile(next);
    setEmbed('');
    setError('');
    setRows([]);
    if (!next) return;
    setWarn(next.size > 16 * 1024 * 1024 ? 'deep file. measuring and sending may feel slow. there is no cutoff.' : null);
    setRows(await measure(next));
  };

  const send = async () => {
    if (!file) return;
    setBusy(true);
    setError('');
    const res = await publishLocalFile(file, { caption: note.trim().slice(0, 180), color: '#FF9F0A' });
    setBusy(false);
    if (!res.ok || !res.id) {
      setError(res.error || 'the line did not hold');
      return;
    }
    setEmbed(res.embed || '');
    setWarn(res.warn || warn);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">leadline</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">sound it, then send it</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">A local file is measured in the tab — size, kind, frame if it is a picture — then written to the share database. Discord unfurls the card. Large drops are warned, never refused.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.5 }} className="glass mt-8 rounded-3xl p-5">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-black/25 px-4 py-10 text-center transition hover:border-white/30">
            <span className="text-[15px] text-white">{file ? file.name : 'drop a file to sound'}</span>
            <span className="mt-1 text-[13px] text-white/45">nothing leaves until you send</span>
            <input type="file" className="sr-only" onChange={(e) => take(e.target.files?.[0] || null)} />
          </label>
          {rows.length > 0 && (
            <dl className="mt-4 divide-y divide-white/5">
              {rows.map((row) => (
                <div key={row.label} className="flex items-baseline justify-between gap-4 py-2.5">
                  <dt className="text-[12px] uppercase tracking-[0.12em] text-white/40">{row.label}</dt>
                  <dd className="truncate text-[14px] text-white/80">{row.value}</dd>
                </div>
              ))}
            </dl>
          )}
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="note on the card" className="mt-3 w-full rounded-2xl bg-black/30 px-4 py-3 text-[15px] outline-none placeholder:text-white/30" />
          <button onClick={send} disabled={!file || busy} className="mt-4 rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-black transition hover:bg-neutral-200 disabled:opacity-50">{busy ? 'sending…' : 'send the sounding'}</button>
          {warn && <p className="mt-3 text-[13px] text-amber-200/80">{warn}</p>}
          {error && <p className="mt-3 text-[13px] text-red-300/90">{error}</p>}
          {embed && (
            <div className="mt-4 flex items-center gap-2">
              <p className="min-w-0 flex-1 truncate text-[13px] text-white/70">{embed}</p>
              <button onClick={async () => { await navigator.clipboard.writeText(embed); setCopied(true); }} className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-[12px] text-white">{copied ? 'copied' : 'copy'}</button>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
