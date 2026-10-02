import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

const ease = [0.22, 1, 0.36, 1] as const;

function money(n: number) {
  if (!Number.isFinite(n)) return '0.00';
  return n.toFixed(2);
}

export default function HawsePage() {
  const [total, setTotal] = useState('86.40');
  const [people, setPeople] = useState('3');
  const [tip, setTip] = useState('12');
  const [note, setNote] = useState('dinner, including the shared bottle');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ embed?: string; warn?: string | null; error?: string } | null>(null);

  const split = useMemo(() => {
    const bill = Number(total) || 0;
    const n = Math.max(1, Math.round(Number(people) || 1));
    const tipRate = Math.max(0, Number(tip) || 0) / 100;
    const withTip = bill * (1 + tipRate);
    return { n, each: withTip / n, withTip };
  }, [total, people, tip]);

  const heavy = !!file && file.size > 40 * 1024 * 1024;

  const send = async () => {
    setBusy(true);
    setResult(null);
    const body = [
      `hawse split`,
      `bill ${money(Number(total) || 0)}`,
      `tip ${tip || 0}%`,
      `${split.n} people`,
      `each ${money(split.each)}`,
      note.trim(),
    ].filter(Boolean).join('\n');
    const receipt = new File([body], 'hawse-split.txt', { type: 'text/plain' });
    const caption = `${split.n} ways · ${money(split.each)} each`;
    const first = await publishLocalFile(file || receipt, {
      caption,
      cardTitle: note.trim() || 'hawse split',
      color: '#30D158',
    });
    if (file && first.ok) {
      await publishLocalFile(receipt, { caption, cardTitle: 'hawse note', color: '#30D158' });
    }
    setResult(first.ok ? { embed: first.embed, warn: first.warn } : { error: first.error || 'did not land' });
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] uppercase tracking-[0.18em] text-zinc-500">hawse</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }} className="mt-2 text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">Split the bill. Keep the slip.</motion.h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-zinc-400">This is a table, not a cabinet. The math stays in the tab until you file it. An optional photo of the receipt lands in the same share database, and Discord unfurls the card.</p>
        <div className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06, duration: 0.55, ease }} className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.32)] backdrop-blur-xl">
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-xs text-zinc-500">bill
                <input value={total} onChange={(e) => setTotal(e.target.value)} inputMode="decimal" className="mt-1 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-[#30D158]/70" />
              </label>
              <label className="text-xs text-zinc-500">people
                <input value={people} onChange={(e) => setPeople(e.target.value)} inputMode="numeric" className="mt-1 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-[#30D158]/70" />
              </label>
              <label className="text-xs text-zinc-500">tip %
                <input value={tip} onChange={(e) => setTip(e.target.value)} inputMode="decimal" className="mt-1 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-[#30D158]/70" />
              </label>
            </div>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="mt-3 w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#30D158]/70" />
            <label className="mt-3 block cursor-pointer rounded-2xl border border-dashed border-white/15 bg-black/25 px-5 py-8 text-center transition duration-300 hover:border-[#30D158]/70">
              <input type="file" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <span className="text-sm text-zinc-200">{file ? file.name : 'optional receipt photo or pdf'}</span>
            </label>
            {heavy && <p className="mt-3 text-xs text-amber-200/90">large slip. the tab may feel slow while it sends. there is no size cap.</p>}
            <button disabled={busy} onClick={send} className="mt-4 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition duration-200 hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-40">{busy ? 'filing…' : 'file the split'}</button>
            {result?.error && <p className="mt-3 text-sm text-rose-300">{result.error}</p>}
            {result?.warn && <p className="mt-3 text-xs text-amber-200/80">{result.warn}</p>}
            {result?.embed && <a className="mt-3 inline-block text-sm text-[#30D158]" href={result.embed}>{result.embed}</a>}
          </motion.section>
          <motion.aside initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.55, ease }} className="rounded-[28px] border border-white/10 bg-[#0b0b0d] p-6">
            <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">each person</p>
            <p className="mt-3 text-6xl font-semibold tracking-tight text-white">{money(split.each)}</p>
            <p className="mt-2 text-sm text-zinc-400">{money(split.withTip)} after tip, across {split.n}.</p>
          </motion.aside>
        </div>
      </main>
    </div>
  );
}
