import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Pin = { id: string; url: string; note: string | null; author: string | null; created_at: string };

function headers() {
  return {
    apikey: SB_KEY,
    Authorization: `Bearer ${SB_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
}

export default function BelayingPage() {
  const { shareId } = useRouter();
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState('pin a link. it lands in the links table, not the vault.');
  const [card, setCard] = useState('');
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Pin[]>([]);
  const [open, setOpen] = useState<Pin | null>(null);

  async function load() {
    const r = await fetch(`${SB_URL}/rest/v1/links?select=id,url,note,author,created_at&order=created_at.desc&limit=16`, { headers: headers() });
    const data = await r.json();
    if (r.ok && Array.isArray(data)) setRows(data);
  }

  useEffect(() => {
    load().catch(() => setStatus('could not read the pin rail'));
  }, []);

  useEffect(() => {
    if (!shareId) return;
    fetch(`${SB_URL}/rest/v1/links?id=eq.${encodeURIComponent(shareId)}&select=*&limit=1`, { headers: headers() })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data[0]) setOpen(data[0]);
      })
      .catch(() => setStatus('that pin did not load'));
  }, [shareId]);

  async function pin() {
    const clean = url.trim();
    if (!/^https?:\/\//i.test(clean) || busy) {
      setStatus('need a full http link');
      return;
    }
    setBusy(true);
    setStatus('writing the pin...');
    const r = await fetch(`${SB_URL}/rest/v1/links`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ url: clean.slice(0, 2000), note: note.slice(0, 180) || null, author: author.slice(0, 60) || null }),
    });
    const data = await r.json().catch(() => null);
    setBusy(false);
    if (!r.ok || !Array.isArray(data) || !data[0]?.id) {
      setStatus('the links table did not take that pin');
      return;
    }
    const id = data[0].id;
    const embed = `${location.origin}/belaying/${id}`;
    setCard(embed);
    setStatus('pinned. paste the card link in Discord.');
    setUrl('');
    setNote('');
    try { await navigator.clipboard.writeText(embed); } catch {}
    load().catch(() => {});
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5 max-w-2xl mx-auto">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[#0a84ff] text-sm font-medium mb-3">belaying</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="text-4xl font-semibold tracking-tight mb-3">a pin on the rail.</motion.h1>
        <p className="text-neutral-400 mb-6 leading-relaxed">not a file drawer. a link, a note, a Discord card. older desks stay where they were.</p>
        {open && (
          <motion.a href={open.url} target="_blank" rel="noreferrer" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="block glass rounded-3xl p-5 mb-6">
            <p className="text-white font-medium">{open.note || 'untitled pin'}</p>
            <p className="text-sm text-[#0a84ff] mt-1 break-all">{open.url}</p>
            <p className="text-xs text-neutral-500 mt-2">{open.author || 'anon'}</p>
          </motion.a>
        )}
        <div className="glass rounded-3xl p-5 space-y-3">
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#0a84ff]/60" />
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="what this is" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#0a84ff]/60" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#0a84ff]/60" />
          <button onClick={pin} disabled={busy} className="rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium disabled:opacity-50">{busy ? 'pinning' : 'pin it'}</button>
          <p className="text-sm text-neutral-400">{status}</p>
          {card && <p className="text-sm text-white break-all">{card}</p>}
        </div>
        <div className="mt-6 space-y-2">
          {rows.map((row, i) => (
            <motion.a key={row.id} href={`/belaying/${row.id}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.03 }} className="block glass rounded-2xl px-4 py-3">
              <p className="text-sm text-white truncate">{row.note || row.url}</p>
              <p className="text-xs text-neutral-500 truncate mt-1">{row.url}</p>
            </motion.a>
          ))}
        </div>
      </main>
    </div>
  );
}
