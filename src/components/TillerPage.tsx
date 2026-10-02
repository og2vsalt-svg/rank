import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

const ease = [0.22, 1, 0.36, 1] as const;

export default function TillerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ embed?: string; warn?: string | null; error?: string } | null>(null);

  const cardTitle = title.trim() || file?.name || 'untitled drop';
  const heavy = useMemo(() => !!file && file.size > 40 * 1024 * 1024, [file]);

  const send = async () => {
    if (!file) return;
    setBusy(true);
    setResult(null);
    const res = await publishLocalFile(file, {
      caption: caption.trim() || cardTitle,
      color,
      cardTitle,
    });
    setResult(res.ok ? { embed: res.embed, warn: res.warn } : { error: res.error || 'did not land' });
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] uppercase tracking-[0.18em] text-zinc-500">tiller</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }} className="mt-2 text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">Steer the card before it leaves.</motion.h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-zinc-400">A local file lands in the share database. Discord reads the title, caption, and accent you set here. Nothing is refused for size.</p>
        <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06, duration: 0.55, ease }} className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.32)] backdrop-blur-xl">
            <label className="block cursor-pointer rounded-2xl border border-dashed border-white/15 bg-black/25 px-5 py-12 text-center transition duration-300 hover:border-[#0A84FF]/70 hover:bg-black/35">
              <input type="file" className="sr-only" onChange={(e) => { setFile(e.target.files?.[0] || null); setResult(null); }} />
              <span className="text-sm text-zinc-200">{file ? file.name : 'choose one local file'}</span>
              {file && <span className="mt-2 block text-xs text-zinc-500">{pretty(file.size)} · {file.type || 'unknown type'}</span>}
            </label>
            <div className="mt-4 grid gap-3">
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="card title" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#0A84FF]/70" />
              <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="one line discord will show" rows={3} className="w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#0A84FF]/70" />
              <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-400">
                accent
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-12 cursor-pointer rounded-lg border-0 bg-transparent" />
              </label>
            </div>
            {heavy && <p className="mt-3 text-xs text-amber-200/90">large drop. the tab may feel slow while it sends. there is no size cap.</p>}
            <button disabled={!file || busy} onClick={send} className="mt-4 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition duration-200 hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-40">{busy ? 'filing…' : 'file and make the card'}</button>
            {result?.error && <p className="mt-3 text-sm text-rose-300">{result.error}</p>}
            {result?.warn && <p className="mt-3 text-xs text-amber-200/80">{result.warn}</p>}
            {result?.embed && <a className="mt-3 inline-block text-sm text-[#0A84FF]" href={result.embed}>{result.embed}</a>}
          </motion.div>
          <motion.aside initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.55, ease }} className="rounded-[28px] border border-white/10 bg-[#0b0b0d] p-5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">discord preview</p>
            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-[#1e1f22]">
              <div className="h-1.5" style={{ background: color }} />
              <div className="px-4 py-4">
                <p className="text-[12px] text-[#00a8fc]">rankvault</p>
                <p className="mt-1 text-[16px] font-semibold text-white">{cardTitle}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-[#b5bac1]">{caption.trim() || 'the caption sits here once you write it.'}</p>
                <p className="mt-3 text-[12px] text-[#949ba4]">{file ? `${file.type || 'file'} · ${pretty(file.size)}` : 'waiting on a local file'}</p>
              </div>
            </div>
          </motion.aside>
        </div>
      </main>
    </div>
  );
}
