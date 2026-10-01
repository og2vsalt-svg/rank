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

type LinkRow = { id: string; url: string; note: string | null; author: string | null; created_at: string };

export default function TransomPage() {
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [rows, setRows] = useState<LinkRow[]>([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const res = await fetch(`${SB_URL}/rest/v1/links?select=id,url,note,author,created_at&order=created_at.desc&limit=20`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data)) setRows(data);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    const clean = url.trim();
    if (!/^https?:\/\//i.test(clean)) {
      setErr('needs a full http link');
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
      body: JSON.stringify({ url: clean, note: note.slice(0, 240) || null, author: author.slice(0, 80) || null }),
    });
    setBusy(false);
    if (!res.ok) {
      setErr('the links table did not take that row');
      return;
    }
    setUrl('');
    setNote('');
    load();
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">transom</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">a window for links, not files</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">
            This desk writes to the links table. It does not touch the vault. Leave an address and a short note; the public list reads back what the table allows.
          </p>
        </motion.div>

        <div className="mt-8 grid gap-3">
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" className="glass rounded-2xl px-4 py-3 text-[14px] outline-none" />
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="why it is here" className="glass rounded-2xl px-4 py-3 text-[14px] outline-none" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="name, optional" className="glass rounded-2xl px-4 py-3 text-[14px] outline-none" />
        </div>
        <button onClick={save} disabled={busy} className="mt-4 w-full rounded-full bg-white px-4 py-3 text-[15px] font-medium text-black disabled:opacity-40">
          {busy ? 'saving…' : 'set it on the transom'}
        </button>
        {err && <p className="mt-3 text-[13px] text-red-300">{err}</p>}

        <div className="mt-8 space-y-2">
          {rows.map((r) => (
            <a key={r.id} href={r.url} className="glass block rounded-2xl px-4 py-3">
              <p className="truncate text-[14px] text-white">{r.note || r.url}</p>
              <p className="mt-1 truncate text-[12px] text-white/40">{r.url}{r.author ? ` · ${r.author}` : ''}</p>
            </a>
          ))}
          {!rows.length && <p className="text-[13px] text-white/40">no public links yet, or the table is closed to reads.</p>}
        </div>
      </main>
    </div>
  );
}
