import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Navbar from './Navbar';

const SUPABASE_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type LinkRow = { id: string; url: string; note: string | null; author: string | null; created_at: string };

function headers() {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
}

export default function LedgerPage() {
  const [rows, setRows] = useState<LinkRow[]>([]);
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState('addresses live on the links shelf. files stay on folio.');
  const [busy, setBusy] = useState(false);

  async function load() {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/links?select=id,url,note,author,created_at&order=created_at.desc&limit=40`, { headers: headers() });
    const data = await r.json();
    if (r.ok && Array.isArray(data)) setRows(data);
    else setStatus('could not read the shelf');
  }

  useEffect(() => {
    load().catch(() => setStatus('could not read the shelf'));
  }, []);

  async function pin() {
    if (busy) return;
    if (!/^https?:\/\//i.test(url.trim())) {
      setStatus('an http address is required');
      return;
    }
    setBusy(true);
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/links`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ url: url.trim().slice(0, 2000), note: note.trim().slice(0, 280) || null, author: (author || 'ledger').slice(0, 80) }),
      });
      if (!r.ok) throw new Error('the shelf refused that address');
      setUrl('');
      setNote('');
      setStatus('pinned. paste /ledger in Discord for the card.');
      await load();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'could not pin that');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-16 pb-24">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[12px] tracking-[0.18em] uppercase text-white/40">ledger</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-[40px] leading-none font-semibold tracking-tight">A shelf for addresses.</motion.h1>
        <p className="mt-3 max-w-xl text-[15px] text-white/60">Not another drawer. Pin a link with a note. The row lands in the links table, and Discord unfurls this page.</p>
        <div className="glass mt-8 rounded-3xl p-5 space-y-3">
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" className="w-full bg-white/5 rounded-2xl px-4 py-3 text-[14px] outline-none" />
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="why it is here" className="w-full bg-white/5 rounded-2xl px-4 py-3 text-[14px] outline-none" />
          <div className="flex gap-3">
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name" className="flex-1 bg-white/5 rounded-2xl px-4 py-3 text-[14px] outline-none" />
            <button onClick={pin} disabled={busy || !url.trim()} className="rounded-full bg-white text-black px-5 text-[14px] font-medium disabled:opacity-40">{busy ? 'Pinning…' : 'Pin'}</button>
          </div>
          <p className="text-[13px] text-white/45">{status}</p>
        </div>
        <ul className="mt-6 space-y-2">
          {rows.map((row) => (
            <li key={row.id} className="glass rounded-2xl px-4 py-3">
              <a href={row.url} className="text-[14px] text-[#64b5ff] break-all">{row.url}</a>
              {row.note && <p className="mt-1 text-[13px] text-white/70">{row.note}</p>}
              <p className="mt-1 text-[11px] text-white/35">{row.author || 'someone'} · {new Date(row.created_at).toLocaleString()}</p>
            </li>
          ))}
          {!rows.length && <li className="text-[13px] text-white/40">nothing pinned yet.</li>}
        </ul>
      </main>
    </div>
  );
}
