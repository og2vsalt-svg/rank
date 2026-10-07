import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { db } from '../lib/db';

type Line = { id: string; book: string; label: string; amount: number | null; note: string | null; author: string | null; created_at: string };

function headers(extra?: Record<string, string>) {
  return { apikey: db.key, Authorization: `Bearer ${db.key}`, ...extra };
}

export default function LedgerPage() {
  const { shareId, navigate } = useRouter();
  const book = (shareId || 'house').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 32) || 'house';
  const [lines, setLines] = useState<Line[]>([]);
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const res = await fetch(`${db.url}/rest/v1/ledger_lines?book=eq.${encodeURIComponent(book)}&select=*&order=created_at.desc&limit=40`, { headers: headers() });
    if (!res.ok) {
      setErr('could not read the book');
      return;
    }
    setLines(await res.json());
  };

  useEffect(() => { load(); }, [book]);

  const total = useMemo(() => lines.reduce((sum, line) => sum + (Number(line.amount) || 0), 0), [lines]);

  const add = async () => {
    if (!label.trim()) return;
    setBusy(true);
    setErr('');
    const id = Math.random().toString(36).slice(2, 10);
    const res = await fetch(`${db.url}/rest/v1/ledger_lines`, {
      method: 'POST',
      headers: headers({ 'Content-Type': 'application/json', Prefer: 'return=representation' }),
      body: JSON.stringify({
        id,
        book,
        label: label.trim(),
        amount: amount.trim() ? Number(amount) : null,
        note: note.trim() || null,
        author: author.trim() || null,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setErr((await res.text()).slice(0, 180) || 'line did not stick');
      return;
    }
    setLabel('');
    setAmount('');
    setNote('');
    const rows = await res.json();
    setLines((prev) => [rows[0], ...prev]);
    if (!shareId) navigate('ledger', book);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#30d158] text-sm mb-2">shared book</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">ledger / {book}</h1>
          <p className="text-neutral-400 text-sm mb-6">a running list, not a file cabinet. paste /ledger/{book} in Discord and the latest line becomes the card.</p>
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="what happened" className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#30d158]/50" />
            <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="amount, optional" inputMode="decimal" className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#30d158]/50" />
          </div>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="note" className="w-full mb-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#30d158]/50" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="name, optional" className="w-full mb-4 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#30d158]/50" />
          <div className="flex items-center justify-between gap-3 mb-6">
            <button onClick={add} disabled={busy || !label.trim()} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 active:scale-[0.98] transition">{busy ? 'writing…' : 'add line'}</button>
            <p className="text-sm text-neutral-400">running {total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          </div>
          {err && <p className="text-xs text-red-400 mb-4">{err}</p>}
          <ul className="space-y-2">
            {lines.map((line) => (
              <li key={line.id} className="rounded-2xl bg-white/[0.03] px-4 py-3">
                <div className="flex justify-between gap-3">
                  <p className="text-sm">{line.label}</p>
                  <p className="text-sm text-neutral-300">{line.amount != null ? Number(line.amount).toLocaleString() : ''}</p>
                </div>
                <p className="text-xs text-neutral-500 mt-1">{line.note || 'no note'}{line.author ? ` · ${line.author}` : ''}</p>
              </li>
            ))}
            {!lines.length && <p className="text-sm text-neutral-500">the book is empty.</p>}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
