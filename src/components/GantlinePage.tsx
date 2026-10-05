import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

const SB_URL = ((import.meta as any).env?.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co').replace(/\/$/, '');
const SB_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type LinkRow = { id: string; url: string; note: string | null; author: string | null; created_at: string };

export default function GantlinePage() {
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [rows, setRows] = useState<LinkRow[]>([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [card, setCard] = useState('');

  const load = async () => {
    const res = await fetch(`${SB_URL}/rest/v1/links?select=id,url,note,author,created_at&order=created_at.desc&limit=12`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data)) setRows(data);
  };

  useEffect(() => { load().catch(() => {}); }, []);

  const save = async () => {
    const clean = url.trim();
    if (!/^https?:\/\//i.test(clean)) {
      setErr('use a full http(s) address.');
      return;
    }
    setBusy(true);
    setErr('');
    const res = await fetch(`${SB_URL}/rest/v1/links`, {
      method: 'POST',
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ url: clean, note: note.trim() || null, author: author.trim() || 'gantline' }),
    });
    setBusy(false);
    if (!res.ok) {
      setErr((await res.text()).slice(0, 180) || 'the line did not take.');
      return;
    }
    const saved = await res.json();
    const id = Array.isArray(saved) && saved[0]?.id ? saved[0].id : '';
    setCard(id ? `${location.origin}/gantline/${id}` : `${location.origin}/gantline`);
    setUrl('');
    setNote('');
    load().catch(() => {});
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-20">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[11px] tracking-[0.22em] uppercase text-neutral-500 mb-3">link line</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="text-4xl font-semibold tracking-tight text-white mb-3">gantline</motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }} className="text-neutral-400 leading-relaxed mb-8 max-w-xl">
          not a file drawer. pin an address and a note on the line. discord still gets a card when you share the page.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-[28px] p-6 mb-6 space-y-3">
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-white/30 transition" />
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="why it is here" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-white/30 transition" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="who tied it" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-white/30 transition" />
          {err && <p className="text-red-300 text-xs">{err}</p>}
          <button disabled={busy} onClick={save} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 hover:bg-neutral-200 transition active:scale-[0.98]">{busy ? 'tying…' : 'tie the line'}</button>
          {card && <p className="text-xs text-neutral-300 break-all">card: {card}</p>}
        </motion.div>
        <div className="space-y-2">
          {rows.map((row, i) => (
            <motion.a key={row.id} href={row.url} target="_blank" rel="noreferrer" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="glass rounded-2xl px-4 py-3 block hover:-translate-y-0.5 transition">
              <span className="text-sm text-white break-all">{row.url}</span>
              {row.note && <span className="block text-xs text-neutral-500 mt-1">{row.note}</span>}
            </motion.a>
          ))}
        </div>
      </main>
    </div>
  );
}
