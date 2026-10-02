import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare } from '../lib/cloudShare';

const SB_URL = ((import.meta as any).env?.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co').replace(/\/$/, '');
const SB_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type LinkRow = { id: string; url: string; note: string | null; author: string | null; created_at: string };

const ease = [0.22, 1, 0.36, 1] as const;

export default function LodestonePage() {
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [rows, setRows] = useState<LinkRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const load = async () => {
    const res = await fetch(`${SB_URL}/rest/v1/links?select=id,url,note,author,created_at&order=created_at.desc&limit=12`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data)) setRows(data);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    const clean = url.trim();
    if (!/^https?:\/\//i.test(clean)) {
      setMsg('needs a full http or https address');
      return;
    }
    setBusy(true);
    setMsg('');
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
    if (!ins.ok) {
      setMsg((await ins.text()).slice(0, 180) || 'links shelf did not take it');
      setBusy(false);
      return;
    }
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const body = `lodestone\n${clean}\n${note.trim()}\n${author.trim()}`;
    const dataUrl = `data:text/plain;base64,${btoa(unescape(encodeURIComponent(body)))}`;
    const filed = await publishShare({ id, name: 'lodestone.txt', type: 'text/plain', size: body.length, dataUrl, caption: note.trim() || clean, author: author.trim() || undefined });
    setMsg(filed.ok ? `${location.origin}/s/${filed.id}` : 'saved on the shelf. card did not file.');
    setUrl('');
    setNote('');
    await load();
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] uppercase tracking-[0.18em] text-zinc-500">lodestone</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }} className="mt-2 text-4xl font-semibold tracking-tight text-zinc-50">A bearing, not a drawer.</motion.h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-zinc-400">Addresses sit on the links shelf. Filing also writes a small text drop so Discord can unfurl the bearing.</p>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.5, ease }} className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-[#0A84FF]/70" />
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="why it matters" className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-[#0A84FF]/70" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name, optional" className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-[#0A84FF]/70" />
          <button disabled={busy} onClick={save} className="mt-4 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-40">{busy ? 'setting…' : 'set the bearing'}</button>
          {msg && <p className="mt-3 break-all text-sm text-[#0A84FF]">{msg}</p>}
        </motion.div>
        <ul className="mt-6 space-y-2">
          {rows.map((row) => (
            <li key={row.id} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <a href={row.url} className="text-sm text-zinc-100 hover:text-[#0A84FF]">{row.url}</a>
              {row.note && <p className="mt-1 text-xs text-zinc-500">{row.note}</p>}
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
