import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';

type Watch = { id: string; watch: string; note?: string; author?: string; link?: string; created_at?: string };

export default function CrossjackPage() {
  const { shareId, navigate } = useRouter();
  const [watch, setWatch] = useState('');
  const [note, setNote] = useState('');
  const [who, setWho] = useState('');
  const [link, setLink] = useState('');
  const [rows, setRows] = useState<Watch[]>([]);
  const [open, setOpen] = useState<Watch | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [card, setCard] = useState('');

  async function load() {
    const res = await fetch('/api/leecloth?page=crossjack&list=1');
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data.rows)) setRows(data.rows);
  }

  useEffect(() => {
    fetch('https://tqfocdktvjuwoiyfgesb.supabase.co/rest/v1/crossjacks?select=id,watch,note,author,link,created_at&order=created_at.desc&limit=30', {
      headers: {
        apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g',
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g',
      },
    }).then((r) => r.json()).then((data) => { if (Array.isArray(data)) setRows(data); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!shareId) return;
    const found = rows.find((row) => row.id === shareId);
    if (found) setOpen(found);
  }, [shareId, rows]);

  async function save() {
    setBusy(true); setErr('');
    try {
      const res = await fetch('/api/leecloth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'crossjack', watch, note, author: who, link }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'watch was not filed');
      setCard(data.url);
      setWatch(''); setNote(''); setLink('');
      navigate('crossjack', data.row.id);
      setRows((prev) => [data.row, ...prev]);
    } catch (e: any) {
      setErr(e?.message || 'could not file the watch');
    } finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen bg-[#070708] text-[#f5f5f7]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[12px] uppercase tracking-[0.18em] text-neutral-500">crossjack</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="mt-2 text-4xl font-semibold tracking-tight">A watch log. No files in this room.</motion.h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-neutral-400">Write what the watch saw. The row lands in Postgres, and /crossjack/id unfurls in Discord. File drops stay on leechoth and the older desks.</p>
        <div className="apple-card mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <input className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none" placeholder="what the watch saw" value={watch} onChange={(e) => setWatch(e.target.value)} />
          <textarea className="mt-3 min-h-24 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none" placeholder="longer note, optional" value={note} onChange={(e) => setNote(e.target.value)} />
          <input className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none" placeholder="related link, optional" value={link} onChange={(e) => setLink(e.target.value)} />
          <input className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none" placeholder="your name, optional" value={who} onChange={(e) => setWho(e.target.value)} />
          <button className="mt-4 rounded-full bg-[#f5f5f7] px-5 py-2.5 text-sm font-medium text-black transition duration-500 hover:-translate-y-0.5 disabled:opacity-40" disabled={!watch.trim() || busy} onClick={save}>{busy ? 'filing…' : 'file the watch'}</button>
          {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
          {card && <p className="mt-3 break-all text-sm text-neutral-300">Discord card: {card}</p>}
        </div>
        {open && (
          <article className="apple-card mt-6 rounded-3xl border border-white/10 p-5">
            <h2 className="text-2xl tracking-tight">{open.watch}</h2>
            {open.note && <p className="mt-2 text-neutral-300">{open.note}</p>}
            {open.link && <a className="mt-3 inline-block text-sm text-sky-300" href={open.link}>{open.link}</a>}
          </article>
        )}
        <ul className="mt-8 space-y-2">
          {rows.map((row) => (
            <li key={row.id}>
              <button className="apple-card w-full rounded-2xl border border-white/10 px-4 py-3 text-left" onClick={() => navigate('crossjack', row.id)}>
                <span className="block">{row.watch}</span>
                {row.author && <span className="text-xs text-neutral-500">{row.author}</span>}
              </button>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
