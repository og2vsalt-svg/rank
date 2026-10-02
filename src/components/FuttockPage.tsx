import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

const ease = [0.22, 1, 0.36, 1] as const;

function mix(hex: string, toward: string, t: number) {
  const parse = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const a = parse(hex);
  const b = parse(toward);
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}

export default function FuttockPage() {
  const [base, setBase] = useState('#0A84FF');
  const [name, setName] = useState('harbour blue');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ embed?: string; warn?: string | null; error?: string } | null>(null);
  const steps = useMemo(() => [0, 0.22, 0.45, 0.68, 1].map((t) => mix(base, '#F5F5F7', t)), [base]);
  const heavy = !!file && file.size > 40 * 1024 * 1024;

  const send = async () => {
    setBusy(true);
    setResult(null);
    const swatch = new File([JSON.stringify({ name, base, steps }, null, 2)], 'futtock.json', { type: 'application/json' });
    const res = await publishLocalFile(file || swatch, {
      caption: `${name} · ${base}`,
      cardTitle: name || 'futtock',
      color: base,
    });
    if (file && res.ok) await publishLocalFile(swatch, { caption: name, cardTitle: name, color: base });
    setResult(res.ok ? { embed: res.embed, warn: res.warn } : { error: res.error || 'did not land' });
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] uppercase tracking-[0.18em] text-zinc-500">futtock</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }} className="mt-2 text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">A ramp, not a folder.</motion.h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-zinc-400">Mix a colour in the tab. File the ramp, and an optional reference image, into the share database. Discord takes the accent.</p>
        <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.55, ease }} className="mt-10 rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.32)] backdrop-blur-xl">
          <div className="flex flex-wrap items-center gap-3">
            <input type="color" value={base} onChange={(e) => setBase(e.target.value)} className="h-12 w-16 cursor-pointer rounded-xl border-0 bg-transparent" />
            <input value={name} onChange={(e) => setName(e.target.value)} className="min-w-[180px] flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-white/30" />
            <span className="font-mono text-sm text-zinc-400">{base}</span>
          </div>
          <div className="mt-6 grid grid-cols-5 overflow-hidden rounded-3xl border border-white/10">
            {steps.map((c) => (
              <div key={c} className="h-28 transition duration-500" style={{ background: c }} />
            ))}
          </div>
          <label className="mt-4 block cursor-pointer rounded-2xl border border-dashed border-white/15 bg-black/25 px-5 py-8 text-center transition hover:border-white/30">
            <input type="file" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <span className="text-sm text-zinc-200">{file ? file.name : 'optional reference file'}</span>
          </label>
          {heavy && <p className="mt-3 text-xs text-amber-200/90">large reference. sending may feel slow. nothing is refused for size.</p>}
          <button disabled={busy} onClick={send} className="mt-4 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition active:scale-[0.98] disabled:opacity-40">{busy ? 'filing…' : 'file the ramp'}</button>
          {result?.error && <p className="mt-3 text-sm text-rose-300">{result.error}</p>}
          {result?.warn && <p className="mt-3 text-xs text-amber-200/80">{result.warn}</p>}
          {result?.embed && <a className="mt-3 inline-block text-sm text-[#0A84FF]" href={result.embed}>{result.embed}</a>}
        </motion.section>
      </main>
    </div>
  );
}
