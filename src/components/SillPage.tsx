import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { db } from '../lib/db';
import { useRouter } from './Router';

type LinkRow = { id: string; url: string; note: string | null; author: string | null; created_at: string };

function tidy(raw: string) {
  const t = raw.trim();
  if (!t) return '';
  if (/^https?:\/\//i.test(t)) return t;
  return 'https://' + t;
}

export default function SillPage() {
  const { shareId } = useRouter();
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [rows, setRows] = useState<LinkRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState('');

  async function load() {
    const res = await fetch(
      `${db.url}/rest/v1/links?select=id,url,note,author,created_at&order=created_at.desc&limit=18`,
      { headers: { apikey: db.key, Authorization: `Bearer ${db.key}` } },
    );
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data)) setRows(data);
  }

  useEffect(() => {
    load().catch(() => setErr('the link table did not answer'));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const next = tidy(url);
    if (!next) return;
    setBusy(true);
    setErr('');
    const res = await fetch(`${db.url}/rest/v1/links`, {
      method: 'POST',
      headers: {
        apikey: db.key,
        Authorization: `Bearer ${db.key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ url: next, note: note.trim() || null, author: author.trim() || null }),
    });
    setBusy(false);
    if (!res.ok) {
      setErr('could not file that link');
      return;
    }
    setUrl('');
    setNote('');
    await load();
  }

  async function copy(id: string) {
    const link = `${location.origin}/sill/${id}`;
    await navigator.clipboard.writeText(link);
    setCopied(id);
    setTimeout(() => setCopied(''), 1400);
  }

  const focus = shareId ? rows.find((r) => r.id === shareId) : null;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pt-28 pb-24">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="text-xs tracking-[0.22em] uppercase text-[#0a84ff]">sill</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06, duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="mt-3 text-4xl font-semibold tracking-tight">a short link, not a drawer</motion.h1>
        <p className="mt-3 text-neutral-400 max-w-xl">Paste a URL. It lands in the links table. Paste /sill in Discord for a card. Older desks stay where they were.</p>
        {focus && (
          <a href={focus.url} className="mt-6 block glass rounded-3xl p-5 hover:-translate-y-0.5">
            <span className="text-xs text-neutral-500">opened from a card</span>
            <span className="mt-1 block text-lg">{focus.note || focus.url}</span>
            <span className="mt-1 block text-sm text-[#64b5ff] truncate">{focus.url}</span>
          </a>
        )}
        <form onSubmit={save} className="mt-8 glass rounded-[28px] p-5 space-y-3">
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/60" />
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="what this is for" className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/60" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name, optional" className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/60" />
          {err && <p className="text-sm text-amber-200/90">{err}</p>}
          <button disabled={busy || !url.trim()} className="rounded-full bg-[#0a84ff] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40">{busy ? 'filing...' : 'file the link'}</button>
        </form>
        <ul className="mt-8 space-y-3">
          {rows.map((row, i) => (
            <motion.li key={row.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="glass rounded-3xl p-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm text-neutral-100 truncate">{row.note || 'untitled link'}</p>
                <a href={row.url} className="text-xs text-[#64b5ff] truncate block">{row.url}</a>
                <p className="text-[11px] text-neutral-500 mt-1">{row.author || 'someone'} · {new Date(row.created_at).toLocaleString()}</p>
              </div>
              <button onClick={() => copy(row.id)} className="shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-xs text-neutral-200">{copied === row.id ? 'copied' : 'copy card'}</button>
            </motion.li>
          ))}
        </ul>
      </main>
    </div>
  );
}
