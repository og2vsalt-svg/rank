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

const moods = ['still', 'late', 'clear', 'rough', 'warm'];
type Leaf = { id: string; body: string; mood: string | null; author: string | null; created_at: string };

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function OrlopPage() {
  const [body, setBody] = useState('');
  const [mood, setMood] = useState('still');
  const [author, setAuthor] = useState('');
  const [rows, setRows] = useState<Leaf[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const load = () => {
    fetch(`${SB_URL}/rest/v1/orlop_leaves?select=*&order=created_at.desc&limit=30`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch(() => setRows([]));
  };
  useEffect(load, []);

  const save = async () => {
    const text = body.trim();
    if (!text) return;
    setBusy(true);
    const id = uid();
    const res = await fetch(`${SB_URL}/rest/v1/orlop_leaves`, {
      method: 'POST',
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ id, body: text, mood, author: author.trim() || null }),
    });
    setBusy(false);
    if (!res.ok) {
      setMsg('the orlop did not keep that leaf.');
      return;
    }
    setBody('');
    setMsg('kept.');
    load();
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">orlop</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">notes under the waterline</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">A writing desk, not a vault. Leaves sit in their own table. Long ones are fine — the page just scrolls.</p>
        </motion.div>
        <div className="glass mt-8 rounded-3xl p-5">
          <div className="flex flex-wrap gap-2">
            {moods.map((m) => (
              <button key={m} onClick={() => setMood(m)} className={`rounded-full px-3 py-1 text-[12px] ${mood === m ? 'bg-white text-black' : 'bg-white/10 text-white/70'}`}>{m}</button>
            ))}
          </div>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} placeholder="what should stay down here" className="mt-4 w-full resize-y rounded-2xl bg-black/30 px-4 py-3 text-[15px] leading-relaxed outline-none placeholder:text-white/30" />
          {body.length > 4000 && <p className="mt-2 text-[12px] text-amber-200/80">long leaf. it will save, it may just take a breath.</p>}
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="signed, optional" className="mt-3 w-full rounded-2xl bg-black/30 px-4 py-3 text-[15px] outline-none placeholder:text-white/30" />
          <button onClick={save} disabled={busy} className="mt-4 rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-black disabled:opacity-50">{busy ? 'keeping…' : 'keep the leaf'}</button>
          {msg && <p className="mt-3 text-[13px] text-white/55">{msg}</p>}
        </div>
        <div className="mt-8 space-y-2">
          {rows.map((r, i) => (
            <motion.article key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.3) }} className="glass rounded-2xl px-4 py-3">
              <p className="text-[12px] uppercase tracking-[0.12em] text-white/35">{r.mood || 'still'}{r.author ? ` · ${r.author}` : ''}</p>
              <p className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed text-white/85">{r.body}</p>
            </motion.article>
          ))}
        </div>
      </main>
    </div>
  );
}
