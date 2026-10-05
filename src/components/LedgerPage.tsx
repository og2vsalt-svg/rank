import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Mark = { id: string; label: string; detail?: string; href?: string; created_at?: string };
type Share = { id: string; name: string; size?: number; caption?: string };

export default function LedgerPage() {
  const [marks, setMarks] = useState<Mark[]>([]);
  const [shares, setShares] = useState<Share[]>([]);
  const [label, setLabel] = useState('');
  const [detail, setDetail] = useState('');
  const [href, setHref] = useState('');
  const [err, setErr] = useState('');

  const load = async () => {
    const [a, b] = await Promise.all([
      fetch('/api/atelier?table=ledger').then((r) => r.json()),
      fetch('/api/share?list=1').then((r) => r.json()).catch(() => ({ rows: [] })),
    ]);
    setMarks(Array.isArray(a.rows) ? a.rows : []);
    const rows = Array.isArray(b) ? b : b.rows || b.shares || [];
    setShares(Array.isArray(rows) ? rows.slice(0, 8) : []);
  };

  useEffect(() => { load().catch(() => setErr('ledger could not load.')); }, []);

  const add = async () => {
    if (!label.trim()) return;
    setErr('');
    const r = await fetch('/api/atelier?table=ledger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label, detail, href }),
    });
    if (!r.ok) {
      setErr('could not write the mark.');
      return;
    }
    setLabel('');
    setDetail('');
    setHref('');
    await load();
  };

  return (
    <div className="min-h-screen bg-[#07080b] text-white">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-10">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs uppercase tracking-[0.22em] text-white/45">ledger</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-4xl font-semibold tracking-tight">A running margin, not a vault.</motion.h1>
        <p className="mt-3 text-white/60">Pin a mark beside the files already shared. Discord still unfurls /ledger and every share link.</p>
        <div className="mt-8 space-y-3 rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="what landed" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-[#0A84FF]" />
          <input value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="one sentence" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-[#0A84FF]" />
          <input value={href} onChange={(e) => setHref(e.target.value)} placeholder="optional link" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-[#0A84FF]" />
          <button onClick={add} className="rounded-full bg-[#0A84FF] px-5 py-2 text-sm font-medium transition active:scale-95">add mark</button>
          {err && <p className="text-sm text-red-300">{err}</p>}
        </div>
        <ul className="mt-8 space-y-3">
          {marks.map((m) => (
            <li key={m.id} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <p className="font-medium">{m.label}</p>
              {m.detail && <p className="text-sm text-white/55">{m.detail}</p>}
              {m.href && <a className="text-sm text-[#64D2FF]" href={m.href}>{m.href}</a>}
            </li>
          ))}
        </ul>
        <h2 className="mt-10 text-sm uppercase tracking-[0.18em] text-white/40">recent public shares</h2>
        <ul className="mt-3 space-y-2">
          {shares.map((s) => (
            <li key={s.id} className="text-sm text-white/70"><a className="text-[#64D2FF]" href={'/s/' + s.id}>{s.name}</a> {s.caption ? ` · ${s.caption}` : ''}</li>
          ))}
          {shares.length === 0 && <li className="text-sm text-white/40">no public shares yet.</li>}
        </ul>
      </main>
    </div>
  );
}
