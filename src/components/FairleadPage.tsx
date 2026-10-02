import { useState } from 'react';
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

export default function FairleadPage() {
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState<string | null>(null);
  const [card, setCard] = useState('');

  const send = async () => {
    let parsed: URL;
    try { parsed = new URL(url.trim()); } catch { setError('that is not a url'); return; }
    setBusy(true);
    setError('');
    const slip = await fetch(`${SB_URL}/rest/v1/links`, {
      method: 'POST',
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ url: parsed.toString(), note: note.trim() || null, author: author.trim() || null }),
    });
    if (!slip.ok) { setBusy(false); setError('the quay did not take the address'); return; }
    const body = [parsed.toString(), note.trim(), author.trim() ? '- ' + author.trim() : ''].filter(Boolean).join('\n');
    const text = new File([body], 'fairlead.txt', { type: 'text/plain' });
    const cover = file
      ? await publishLocalFile(file, { caption: note.trim().slice(0, 180) || parsed.host, author: author.trim() || undefined, color: '#0A84FF' })
      : await publishLocalFile(text, { caption: note.trim().slice(0, 180) || parsed.host, author: author.trim() || undefined, color: '#0A84FF' });
    setBusy(false);
    if (!cover.ok) { setError(cover.error || 'address saved, card did not file'); return; }
    setWarn(cover.warn || (file && file.size > 20 * 1024 * 1024 ? 'cover is large. preview may feel slow.' : null));
    setCard(cover.embed || '');
    setUrl('');
    setNote('');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] uppercase tracking-[0.16em] text-zinc-500">fairlead</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-2 text-4xl font-semibold tracking-tight text-zinc-50">An address, with a card.</motion.h1>
        <p className="mt-3 max-w-xl text-zinc-400">Save a link on the quay, then file a small card so Discord can unfurl it. A cover image is optional. Not a file cabinet.</p>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-zinc-100 outline-none focus:border-[#0A84FF]" />
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="why this link" className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-zinc-100 outline-none focus:border-[#0A84FF]" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="from (optional)" className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-zinc-100 outline-none focus:border-[#0A84FF]" />
          <label className="mt-3 block text-sm text-zinc-400">optional cover<input type="file" className="mt-2 block w-full text-sm text-zinc-500" onChange={(e) => setFile(e.target.files?.[0] || null)} /></label>
          <button disabled={busy || !url.trim()} onClick={send} className="mt-4 rounded-full bg-[#0A84FF] px-5 py-2.5 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-40">{busy ? 'tying…' : 'tie the address'}</button>
          {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
          {warn && <p className="mt-3 text-sm text-amber-200">{warn}</p>}
          {card && <a className="mt-4 block text-sm text-[#7ab8ff] underline" href={card}>{card}</a>}
        </motion.div>
      </main>
    </div>
  );
}
