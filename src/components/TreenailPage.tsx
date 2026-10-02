import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

async function digest(file: File) {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function TreenailPage() {
  const [a, setA] = useState<File | null>(null);
  const [b, setB] = useState<File | null>(null);
  const [line, setLine] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [card, setCard] = useState('');
  const [match, setMatch] = useState<string>('');

  async function fileIt() {
    setErr('');
    setMatch('');
    if (!a || !b) {
      setErr('pick both local files.');
      return;
    }
    setBusy(true);
    const slow = a.size + b.size > 24 * 1024 * 1024;
    if (slow) setWarn('large pair. hashing and sending may feel slow. nothing is refused.');
    const [ha, hb] = await Promise.all([digest(a), digest(b)]);
    const same = ha === hb;
    setMatch(same ? 'same bytes' : 'different bytes');
    const body = [
      line.trim(),
      '',
      `a  ${a.name}  ${pretty(a.size)}`,
      ha,
      `b  ${b.name}  ${pretty(b.size)}`,
      hb,
      '',
      same ? 'the hashes match.' : 'the hashes do not match.',
    ].filter((row, i) => i !== 0 || row).join('\n');
    const file = new File([body], 'treenail.txt', { type: 'text/plain' });
    const res = await publishLocalFile(file, {
      cardTitle: same ? 'treenail · same' : 'treenail · different',
      caption: (line.trim() || (same ? 'the two files match' : 'the two files differ')).slice(0, 280),
      author: 'treenail',
      color: same ? '#30D158' : '#FF9F0A',
    });
    setBusy(false);
    if (!res.ok || !res.id) {
      setErr(res.error || 'the share table did not take the receipt.');
      return;
    }
    setCard(res.embed || shareUrls(res.id).embed);
    if (res.warn) setWarn(res.warn);
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] uppercase tracking-[0.16em] text-zinc-500">treenail</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="mt-2 text-4xl font-semibold tracking-tight">Two files, one receipt.</motion.h1>
        <p className="mt-3 text-[15px] leading-relaxed text-zinc-400">Hash a pair in the tab, then file the comparison. Discord unfurls the receipt. The originals stay on your machine.</p>
        <div className="mt-8 space-y-3 rounded-[28px] border border-white/10 bg-white/[0.04] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl">
          <label className="block cursor-pointer rounded-2xl border border-dashed border-white/15 px-4 py-4 text-sm text-zinc-400 transition hover:border-white/30">
            {a ? `a · ${a.name}` : 'first local file'}
            <input type="file" className="hidden" onChange={(e) => setA(e.target.files?.[0] || null)} />
          </label>
          <label className="block cursor-pointer rounded-2xl border border-dashed border-white/15 px-4 py-4 text-sm text-zinc-400 transition hover:border-white/30">
            {b ? `b · ${b.name}` : 'second local file'}
            <input type="file" className="hidden" onChange={(e) => setB(e.target.files?.[0] || null)} />
          </label>
          <input value={line} onChange={(e) => setLine(e.target.value)} placeholder="optional line on the card" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#30D158]/50" />
          {match && <p className="text-sm text-zinc-300">{match}</p>}
          {warn && <p className="text-xs text-amber-200/80">{warn}</p>}
          <button onClick={fileIt} disabled={busy} className="w-full rounded-full bg-white py-3 text-sm font-medium text-black transition active:scale-[0.98] disabled:opacity-60">{busy ? 'hashing…' : 'file the receipt'}</button>
          {err && <p className="text-sm text-red-300">{err}</p>}
          {card && (
            <button onClick={() => navigator.clipboard.writeText(card)} className="w-full rounded-2xl bg-white/8 px-3 py-3 text-left text-xs text-zinc-200">{card}<span className="mt-1 block text-[11px] text-zinc-400">copied when you tap. paste it in Discord.</span></button>
          )}
        </div>
      </main>
    </div>
  );
}
