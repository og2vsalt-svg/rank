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

type Card = { id: string; url: string; title: string; note: string | null; color: string | null; author: string | null };

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function LoamPage() {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [color, setColor] = useState('#0A84FF');
  const [rows, setRows] = useState<Card[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [copied, setCopied] = useState('');

  const load = () => {
    fetch(`${SB_URL}/rest/v1/hawser_cards?select=id,url,title,note,color,author&order=created_at.desc&limit=24`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch(() => setRows([]));
  };
  useEffect(load, []);

  const save = async () => {
    const clean = url.trim();
    if (!/^https?:\/\//i.test(clean)) {
      setMsg('needs a full http link');
      return;
    }
    setBusy(true);
    setMsg('');
    const id = uid();
    const cardTitle = title.trim() || clean.replace(/^https?:\/\//, '').slice(0, 80);
    const headers = {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    };
    const card = await fetch(`${SB_URL}/rest/v1/hawser_cards`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ id, url: clean, title: cardTitle, note: note.trim() || null, color, author: author.trim() || null }),
    });
    await fetch(`${SB_URL}/rest/v1/links`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ url: clean, note: note.trim() || cardTitle, author: author.trim() || null }),
    });
    const share = await fetch(`${SB_URL}/rest/v1/public_shares`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        id,
        name: cardTitle,
        mime: 'text/uri-list',
        size: clean.length,
        file_url: clean,
        is_public: true,
        author: author.trim() || null,
        caption: note.trim() || null,
        meta: { caption: note.trim() || null, color, source: 'loam', cardTitle },
      }),
    });
    setBusy(false);
    if (!card.ok || !share.ok) {
      setMsg('the shelf did not take that one. try again in a moment.');
      return;
    }
    setUrl('');
    setTitle('');
    setNote('');
    setMsg(`${location.origin}/s/${id}`);
    load();
  };

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(value);
    setTimeout(() => setCopied(''), 1100);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">loam</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">a line you can hand someone</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">Not a file. A link, a title, a colour. It lands in the link table and gets a Discord card on /s.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.55 }} className="glass mt-8 rounded-3xl p-5">
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" className="w-full rounded-2xl bg-black/30 px-4 py-3 text-[15px] outline-none placeholder:text-white/30" />
          <div className="mt-3 grid grid-cols-[1fr_auto] gap-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="title, if you want one" className="rounded-2xl bg-black/30 px-4 py-3 text-[15px] outline-none placeholder:text-white/30" />
            <input aria-label="card colour" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-12 w-14 rounded-2xl bg-transparent" />
          </div>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="a short note for the card" className="mt-3 w-full rounded-2xl bg-black/30 px-4 py-3 text-[15px] outline-none placeholder:text-white/30" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name, optional" className="mt-3 w-full rounded-2xl bg-black/30 px-4 py-3 text-[15px] outline-none placeholder:text-white/30" />
          <button onClick={save} disabled={busy} className="mt-4 rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-black disabled:opacity-50">{busy ? 'setting…' : 'set the line'}</button>
          {msg && <p className="mt-3 break-all text-[13px] text-white/55">{msg}</p>}
        </motion.div>
        <div className="mt-8 space-y-2">
          {rows.map((r, i) => {
            const embed = `${location.origin}/s/${r.id}`;
            return (
              <motion.a key={r.id} href={r.url} target="_blank" rel="noreferrer" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="glass flex items-center gap-3 rounded-2xl px-4 py-3">
                <span className="h-8 w-1.5 rounded-full" style={{ background: r.color || '#0A84FF' }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px]">{r.title || r.url}</span>
                  <span className="block truncate text-[12px] text-white/40">{r.note || r.url}</span>
                </span>
                <button onClick={(e) => { e.preventDefault(); copy(embed); }} className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-[12px]">{copied === embed ? 'copied' : 'copy /s'}</button>
              </motion.a>
            );
          })}
        </div>
      </main>
    </div>
  );
}
