import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

type Line = { id: string; label: string; amount: string };

export default function QuayagePage() {
  const [who, setWho] = useState('');
  const [lines, setLines] = useState<Line[]>([{ id: '1', label: '', amount: '' }]);
  const [busy, setBusy] = useState(false);
  const [card, setCard] = useState('');
  const [error, setError] = useState('');

  const total = useMemo(
    () => lines.reduce((sum, line) => sum + (Number(line.amount) || 0), 0),
    [lines],
  );

  const add = () => setLines((rows) => [...rows, { id: String(Date.now()), label: '', amount: '' }]);
  const patch = (id: string, key: 'label' | 'amount', value: string) =>
    setLines((rows) => rows.map((row) => (row.id === id ? { ...row, [key]: value } : row)));

  const fileReceipt = async () => {
    setBusy(true);
    setError('');
    const body = [
      'quayage',
      who.trim() ? `for ${who.trim()}` : 'untagged',
      ...lines.filter((l) => l.label || l.amount).map((l) => `${l.label || 'line'}\t${l.amount || '0'}`),
      `total\t${total.toFixed(2)}`,
    ].join('\n');
    const file = new File([body], 'quayage.txt', { type: 'text/plain' });
    const res = await publishLocalFile(file, { caption: `quayage · ${total.toFixed(2)}`, author: who.trim() || undefined, color: '#0A84FF' });
    setBusy(false);
    if (!res.ok) {
      setError(res.error || 'the receipt did not land');
      return;
    }
    setCard(res.embed || '');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] uppercase tracking-[0.16em] text-zinc-500">quayage</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-4xl font-semibold tracking-tight text-zinc-50">A tally, not a vault.</motion.h1>
        <p className="mt-3 max-w-xl text-zinc-400">Add lines, watch the total, then file the receipt as text. Discord gets the card. No file ceiling, and nothing is stored until you send it.</p>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
          <input value={who} onChange={(e) => setWho(e.target.value)} placeholder="who this is for" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-zinc-100 outline-none focus:border-[#0A84FF]" />
          <div className="mt-4 space-y-2">
            {lines.map((line) => (
              <div key={line.id} className="grid grid-cols-[1fr_7rem] gap-2">
                <input value={line.label} onChange={(e) => patch(line.id, 'label', e.target.value)} placeholder="line" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-zinc-100 outline-none" />
                <input value={line.amount} onChange={(e) => patch(line.id, 'amount', e.target.value)} placeholder="0.00" inputMode="decimal" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-zinc-100 outline-none" />
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <button onClick={add} className="text-sm text-zinc-400">add a line</button>
            <p className="text-2xl font-semibold tracking-tight text-white tabular-nums">{total.toFixed(2)}</p>
          </div>
          <button disabled={busy} onClick={fileReceipt} className="mt-4 rounded-full bg-[#0A84FF] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40">{busy ? 'filing…' : 'file the receipt'}</button>
          {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
          {card && <a className="mt-3 block text-sm text-[#7ab8ff] underline" href={card}>{card}</a>}
        </motion.div>
      </main>
    </div>
  );
}
