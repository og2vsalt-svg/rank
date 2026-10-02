import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

type Row = { name: string; size: number; embed?: string; warn?: string | null; error?: string };

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function StemsonPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [caption, setCaption] = useState('');
  const heavy = useMemo(() => files.some((f) => f.size > 40 * 1024 * 1024), [files]);

  const send = async () => {
    if (!files.length) return;
    setBusy(true);
    const next: Row[] = [];
    for (const file of files) {
      const res = await publishLocalFile(file, { caption: caption.trim() || file.name, color: '#0A84FF' });
      next.push({
        name: file.name,
        size: file.size,
        embed: res.embed,
        warn: res.warn,
        error: res.ok ? undefined : res.error || 'did not land',
      });
    }
    setRows(next);
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] uppercase tracking-[0.16em] text-zinc-500">stemson</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="mt-2 text-4xl font-semibold tracking-tight text-zinc-50">Send the local pile.</motion.h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-zinc-400">Each file is written into the share database, then Discord gets its own /s card. Nothing is refused for size. A heavy file only gets a slowness note.</p>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <label className="block cursor-pointer rounded-2xl border border-dashed border-white/15 bg-black/20 px-5 py-10 text-center transition hover:border-[#0A84FF]/60">
            <input type="file" multiple className="sr-only" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
            <span className="text-sm text-zinc-300">{files.length ? `${files.length} ready` : 'choose local files'}</span>
          </label>
          <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="caption for the cards" className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-[#0A84FF]/70" />
          {heavy && <p className="mt-3 text-xs text-amber-200/90">large drop. the tab may feel slow while it sends. there is no size cap.</p>}
          <button disabled={busy || !files.length} onClick={send} className="mt-4 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:opacity-40">{busy ? 'sending…' : 'file them'}</button>
          <ul className="mt-6 space-y-3">
            {files.map((f) => (
              <li key={f.name + f.size} className="flex items-center justify-between text-sm text-zinc-400">
                <span className="truncate pr-3 text-zinc-200">{f.name}</span>
                <span>{pretty(f.size)}</span>
              </li>
            ))}
          </ul>
        </motion.div>
        {rows.length > 0 && (
          <div className="mt-6 space-y-3">
            {rows.map((row) => (
              <div key={row.name + row.size} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm">
                <p className="text-zinc-100">{row.name}</p>
                {row.error && <p className="mt-1 text-rose-300">{row.error}</p>}
                {row.warn && <p className="mt-1 text-amber-200/80">{row.warn}</p>}
                {row.embed && <a className="mt-1 inline-block text-[#0A84FF]" href={row.embed}>{row.embed}</a>}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
