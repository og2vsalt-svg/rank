import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

const SB_URL = (
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  'https://tqfocdktvjuwoiyfgesb.supabase.co'
).replace(/\/$/, '');
const SB_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Watch = { id: string; label: string; done: boolean; author: string | null };

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function CarrelPage() {
  const [label, setLabel] = useState('');
  const [author, setAuthor] = useState('');
  const [rows, setRows] = useState<Watch[]>([]);
  const [busy, setBusy] = useState(false);

  const load = () => {
    fetch(`${SB_URL}/rest/v1/gunwale_watches?select=id,label,done,author&order=created_at.desc&limit=40`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch(() => setRows([]));
  };
  useEffect(load, []);

  const add = async () => {
    const text = label.trim();
    if (!text) return;
    setBusy(true);
    await fetch(`${SB_URL}/rest/v1/gunwale_watches`, {
      method: 'POST',
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ id: uid(), label: text, done: false, author: author.trim() || null }),
    });
    setBusy(false);
    setLabel('');
    load();
  };

  const tick = async (row: Watch) => {
    setRows((cur) => cur.map((r) => (r.id === row.id ? { ...r, done: !r.done } : r)));
    await fetch(`${SB_URL}/rest/v1/gunwale_watches?id=eq.${encodeURIComponent(row.id)}`, {
      method: 'PATCH',
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ done: !row.done }),
    });
  };

  const open = rows.filter((r) => !r.done).length;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">carrel</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">a shared watch list</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">{open} still open. Anyone on this deck can add a watch and tick it. No files involved.</p>
        </motion.div>
        <div className="glass mt-8 rounded-3xl p-5">
          <input value={label} onChange={(e) => setLabel(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="what needs a watch" className="w-full rounded-2xl bg-black/30 px-4 py-3 text-[15px] outline-none placeholder:text-white/30" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="who is watching, optional" className="mt-3 w-full rounded-2xl bg-black/30 px-4 py-3 text-[15px] outline-none placeholder:text-white/30" />
          <button onClick={add} disabled={busy} className="mt-4 rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-black disabled:opacity-50">add to the rail</button>
        </div>
        <div className="mt-8 space-y-2">
          {rows.map((r, i) => (
            <motion.button key={r.id} onClick={() => tick(r)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.025, 0.28) }} className="glass flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left">
              <span className={`grid h-5 w-5 place-items-center rounded-full border ${r.done ? 'border-white bg-white text-black' : 'border-white/25'}`}>{r.done ? '✓' : ''}</span>
              <span className={`min-w-0 flex-1 text-[15px] ${r.done ? 'text-white/35 line-through' : ''}`}>{r.label}</span>
              {r.author && <span className="text-[12px] text-white/35">{r.author}</span>}
            </motion.button>
          ))}
        </div>
      </main>
    </div>
  );
}
