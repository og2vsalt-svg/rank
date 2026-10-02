import { useEffect, useMemo, useState } from 'react';
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

function pretty(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.max(1, Math.round(n / 1024)) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function left(due: string) {
  const ms = +new Date(due) - Date.now();
  if (ms <= 0) return 'due';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 48) return Math.floor(h / 24) + 'd';
  return h + 'h ' + m + 'm';
}

export default function KevelPage() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [due, setDue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState<string | null>(null);
  const [card, setCard] = useState('');
  const [copied, setCopied] = useState(false);
  const [rows, setRows] = useState<{ id: string; title: string; due_at: string; file_share_id: string | null }[]>([]);

  const slow = useMemo(() => (file && file.size > 25 * 1024 * 1024 ? 'large drop. the tab may feel slow while it sends. nothing is refused.' : null), [file]);

  const load = async () => {
    const res = await fetch(`${SB_URL}/rest/v1/handoffs?select=id,title,due_at,file_share_id&order=due_at.asc&limit=12`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data)) setRows(data);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, []);

  const send = async () => {
    if (!file || !title.trim() || !due) return;
    setBusy(true);
    setError('');
    setCopied(false);
    const dueIso = new Date(due).toISOString();
    const res = await publishLocalFile(file, {
      caption: `${title.trim()} · ready ${dueIso.slice(0, 16).replace('T', ' ')}`,
      author: author.trim() || undefined,
      expiresAt: dueIso,
      color: '#0A84FF',
    });
    if (!res.ok || !res.id) {
      setBusy(false);
      setError(res.error || 'the file did not land');
      return;
    }
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const row = await fetch(`${SB_URL}/rest/v1/handoffs`, {
      method: 'POST',
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        id,
        title: title.trim().slice(0, 160),
        due_at: dueIso,
        file_share_id: res.id,
        note: note.trim().slice(0, 280) || null,
        author: author.trim() || null,
      }),
    });
    setBusy(false);
    if (!row.ok) {
      setError('file landed, the deadline row did not');
      setCard(res.embed || '');
      return;
    }
    setWarn(res.warn || slow);
    setCard(res.embed || '');
    setFile(null);
    load();
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] uppercase tracking-[0.16em] text-zinc-500">kevel</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-2 text-4xl font-semibold tracking-tight text-zinc-50">A file with a time on it.</motion.h1>
        <p className="mt-3 max-w-xl text-zinc-400">Not a cabinet. Pick a local file, name the handoff, set when it should be ready. The bytes go to the share table. Discord unfurls /s. Large files are warned, never cut off.</p>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <label className="block text-sm text-zinc-300">local file<input type="file" className="mt-2 block w-full text-sm text-zinc-400" onChange={(e) => setFile(e.target.files?.[0] || null)} /></label>
          {file && <p className="mt-2 text-sm text-zinc-500">{file.name} · {pretty(file.size)}{slow ? ` · ${slow}` : ''}</p>}
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="what is this handoff" className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-zinc-100 outline-none focus:border-[#0A84FF]" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="from (optional)" className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-zinc-100 outline-none focus:border-[#0A84FF]" />
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="a line for the person receiving it" className="mt-3 h-24 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-zinc-100 outline-none focus:border-[#0A84FF]" />
          <label className="mt-3 block text-sm text-zinc-400">ready by<input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-zinc-100 outline-none" /></label>
          <button disabled={busy || !file || !title.trim() || !due} onClick={send} className="mt-4 rounded-full bg-[#0A84FF] px-5 py-2.5 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-40">{busy ? 'sending…' : 'file the handoff'}</button>
          {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
          {warn && <p className="mt-3 text-sm text-amber-200">{warn}</p>}
          {card && (
            <div className="mt-4 flex items-center gap-3 text-sm">
              <a className="text-[#7ab8ff] underline" href={card}>{card}</a>
              <button className="text-zinc-400" onClick={() => { navigator.clipboard.writeText(card); setCopied(true); }}>{copied ? 'copied' : 'copy'}</button>
            </div>
          )}
        </motion.div>
        <ul className="mt-8 space-y-2">
          {rows.map((row) => (
            <li key={row.id} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm">
              <span className="text-zinc-200">{row.title}</span>
              <span className="text-zinc-500">{left(row.due_at)}{row.file_share_id ? ` · /s/${row.file_share_id}` : ''}</span>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
