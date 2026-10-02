import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

type Slip = { url: string; note: string };

export default function WalesPage() {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [slips, setSlips] = useState<Slip[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [card, setCard] = useState('');

  function add() {
    setErr('');
    const clean = url.trim();
    if (!/^https?:\/\//i.test(clean)) {
      setErr('start the address with http.');
      return;
    }
    setSlips((rows) => [...rows, { url: clean, note: note.trim() }]);
    setUrl('');
    setNote('');
  }

  async function fileIt() {
    setErr('');
    if (!slips.length) {
      setErr('add at least one address.');
      return;
    }
    setBusy(true);
    const body = [`# ${title.trim() || 'wales'}`, '', ...slips.map((s, i) => `${i + 1}. ${s.url}${s.note ? ` — ${s.note}` : ''}`)].join('\n');
    const file = new File([body], 'wales.md', { type: 'text/markdown' });
    const res = await publishLocalFile(file, {
      cardTitle: title.trim() || 'wales reading',
      caption: `${slips.length} address${slips.length === 1 ? '' : 'es'}`,
      author: 'wales',
      color: '#64D2FF',
    });
    setBusy(false);
    if (!res.ok || !res.id) {
      setErr(res.error || 'the share table did not take the list.');
      return;
    }
    setCard(res.embed || shareUrls(res.id).embed);
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] uppercase tracking-[0.16em] text-zinc-500">wales</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="mt-2 text-4xl font-semibold tracking-tight">A reading list, filed.</motion.h1>
        <p className="mt-3 text-[15px] leading-relaxed text-zinc-400">Stack addresses in the tab. Filing writes one markdown drop to the share table. Discord unfurls the list, not a cabinet.</p>
        <div className="mt-8 space-y-3 rounded-[28px] border border-white/10 bg-white/[0.04] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="list title" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#64D2FF]/60" />
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#64D2FF]/60" />
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="why it is here" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#64D2FF]/60" />
          <button onClick={add} className="w-full rounded-full border border-white/15 py-2.5 text-sm text-zinc-200 transition active:scale-[0.98]">add address</button>
          {slips.length > 0 && (
            <ol className="space-y-2 text-sm text-zinc-300">
              {slips.map((s, i) => (
                <li key={`${s.url}-${i}`} className="rounded-2xl bg-black/25 px-3 py-2">
                  <span className="block truncate text-zinc-100">{s.url}</span>
                  {s.note && <span className="text-xs text-zinc-500">{s.note}</span>}
                </li>
              ))}
            </ol>
          )}
          <button onClick={fileIt} disabled={busy} className="w-full rounded-full bg-white py-3 text-sm font-medium text-black transition active:scale-[0.98] disabled:opacity-60">{busy ? 'filing…' : 'file the list'}</button>
          {err && <p className="text-sm text-red-300">{err}</p>}
          {card && (
            <button onClick={() => navigator.clipboard.writeText(card)} className="w-full rounded-2xl bg-[#64D2FF]/10 px-3 py-3 text-left text-xs text-[#b6ecff]">{card}<span className="mt-1 block text-[11px] text-zinc-400">copied when you tap. paste it in Discord.</span></button>
          )}
        </div>
      </main>
    </div>
  );
}
