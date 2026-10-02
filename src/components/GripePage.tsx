import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

const seed = ['keys handed over', 'meter photo taken', 'spare still on the hook'];

export default function GripePage() {
  const [items, setItems] = useState(seed.map((label) => ({ label, done: false })));
  const [draft, setDraft] = useState('');
  const [who, setWho] = useState('');
  const [card, setCard] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function fileIt() {
    setBusy(true);
    setErr('');
    const body = [`# gripe`, who ? `for ${who}` : '', '', ...items.map((item) => `- [${item.done ? 'x' : ' '}] ${item.label}`)].filter(Boolean).join('\n');
    const file = new File([body], 'gripe.md', { type: 'text/markdown' });
    const res = await publishLocalFile(file, {
      cardTitle: who ? `gripe for ${who}` : 'gripe',
      caption: `${items.filter((i) => i.done).length}/${items.length} marked`,
      author: 'gripe',
      color: '#30D158',
    });
    setBusy(false);
    if (!res.ok || !res.id) {
      setErr(res.error || 'could not file the list');
      return;
    }
    setCard(res.embed || shareUrls(res.id).embed);
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] uppercase tracking-[0.16em] text-zinc-500">gripe</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="mt-2 text-4xl font-semibold tracking-tight">A handover list.</motion.h1>
        <p className="mt-3 text-zinc-400">Tick what is done. Filing writes a markdown receipt into the share table, not the vault grid.</p>
        <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
          <input value={who} onChange={(e) => setWho(e.target.value)} placeholder="who it is for" className="mb-3 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none" />
          <ul className="space-y-1">
            {items.map((item, i) => (
              <li key={item.label + i}>
                <button onClick={() => setItems((rows) => rows.map((row, j) => j === i ? { ...row, done: !row.done } : row))} className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left text-sm transition hover:bg-white/5">
                  <span className={`grid h-5 w-5 place-items-center rounded-full border ${item.done ? 'border-[#30D158] bg-[#30D158] text-black' : 'border-white/20'}`}>{item.done ? '✓' : ''}</span>
                  <span className={item.done ? 'text-zinc-500 line-through' : 'text-zinc-100'}>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="add a line" className="flex-1 rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm outline-none" />
            <button onClick={() => { if (!draft.trim()) return; setItems((rows) => [...rows, { label: draft.trim(), done: false }]); setDraft(''); }} className="rounded-full bg-white/10 px-4 text-sm">add</button>
          </div>
          <button onClick={fileIt} disabled={busy} className="mt-4 w-full rounded-full bg-white py-3 text-sm font-medium text-black disabled:opacity-60">{busy ? 'filing…' : 'file the receipt'}</button>
          {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
          {card && <button onClick={() => navigator.clipboard.writeText(card)} className="mt-3 w-full text-left text-xs text-[#9ecbff]">{card}</button>}
        </div>
      </main>
    </div>
  );
}
