import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

const SB_URL = (
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  'https://tqfocdktvjuwoiyfgesb.supabase.co'
).replace(/\/$/, '');
const SB_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type LinkRow = { id: string; url: string; note: string | null; author: string | null; created_at: string };

export default function BilletPage() {
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [card, setCard] = useState('');
  const [rows, setRows] = useState<LinkRow[]>([]);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    const res = await fetch(`${SB_URL}/rest/v1/links?select=id,url,note,author,created_at&order=created_at.desc&limit=12`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data)) setRows(data);
  };

  useEffect(() => { load(); }, []);

  const send = async () => {
    const clean = url.trim();
    if (!/^https?:\/\//i.test(clean)) {
      setError('needs a full http or https address');
      return;
    }
    setBusy(true);
    setError('');
    setCopied(false);
    const slip = new File(
      [`${note.trim() || 'a billet'}\n${clean}\n`],
      'billet.txt',
      { type: 'text/plain' },
    );
    const filed = await publishLocalFile(slip, {
      caption: (note.trim() || clean).slice(0, 180),
      author: author.trim() || undefined,
    });
    const ins = await fetch(`${SB_URL}/rest/v1/links`, {
      method: 'POST',
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ url: clean, note: note.trim() || null, author: author.trim() || null }),
    });
    setBusy(false);
    if (!ins.ok) {
      setError((await ins.text()).slice(0, 180) || 'the shelf did not take it');
      return;
    }
    setCard(filed.embed || '');
    setUrl('');
    setNote('');
    load();
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">billet</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">a slip for an address</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">This desk is not a file cabinet. It keeps a link on the shelf, then files a one-line card so Discord can unfurl it. The address stays readable on the quay.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.5 }} className="glass mt-8 rounded-3xl p-5">
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" className="w-full rounded-2xl bg-black/30 px-4 py-3 text-[15px] outline-none placeholder:text-white/30" />
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="what it is" className="mt-3 w-full rounded-2xl bg-black/30 px-4 py-3 text-[15px] outline-none placeholder:text-white/30" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="from" className="mt-3 w-full rounded-2xl bg-black/30 px-4 py-3 text-[15px] outline-none placeholder:text-white/30" />
          <button onClick={send} disabled={busy || !url.trim()} className="mt-4 rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-black transition hover:bg-neutral-200 disabled:opacity-50">{busy ? 'filing…' : 'leave the slip'}</button>
          {error && <p className="mt-3 text-[13px] text-red-300/90">{error}</p>}
          {card && (
            <div className="mt-4 flex items-center gap-2">
              <p className="min-w-0 flex-1 truncate text-[13px] text-white/70">{card}</p>
              <button onClick={async () => { await navigator.clipboard.writeText(card); setCopied(true); }} className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-[12px] text-white">{copied ? 'copied' : 'copy'}</button>
            </div>
          )}
        </motion.div>
        <div className="mt-6 space-y-2">
          {rows.map((row) => (
            <a key={row.id} href={row.url} target="_blank" rel="noreferrer" className="glass block rounded-2xl px-4 py-3 transition hover:-translate-y-0.5">
              <p className="truncate text-[14px] text-white">{row.note || row.url}</p>
              <p className="truncate text-[12px] text-white/40">{row.url}</p>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}
