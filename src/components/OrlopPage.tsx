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

type Note = { id: string; room: string; body: string; author: string | null; created_at: string };

function headers() {
  return { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };
}

export default function OrlopPage() {
  const [room, setRoom] = useState('main');
  const [body, setBody] = useState('');
  const [author, setAuthor] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState('');

  const load = async (next = room) => {
    const res = await fetch(
      `${SB_URL}/rest/v1/orlop_notes?room=eq.${encodeURIComponent(next)}&select=id,room,body,author,created_at&order=created_at.desc&limit=40`,
      { headers: headers() },
    );
    if (!res.ok) return;
    const rows = await res.json();
    if (Array.isArray(rows)) setNotes(rows);
  };

  useEffect(() => { load('main').catch(() => {}); }, []);

  const leave = async () => {
    const line = body.trim();
    if (!line) return;
    setBusy(true);
    setErr('');
    try {
      const res = await fetch(`${SB_URL}/rest/v1/orlop_notes`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ room: room.trim() || 'main', body: line.slice(0, 500), author: author || null }),
      });
      if (!res.ok) {
        setErr((await res.text()).slice(0, 180) || 'board refused the line');
        return;
      }
      setBody('');
      await load(room.trim() || 'main');
    } catch (e: any) {
      setErr(e?.message || 'could not leave the line');
    } finally {
      setBusy(false);
    }
  };

  const copyCard = async () => {
    const link = `${location.origin}/orlop`;
    setCopied(link);
    try { await navigator.clipboard.writeText(link); } catch {}
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#ff9f0a] text-sm mb-2">orlop</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a board under the deck.</h1>
          <p className="text-neutral-400 text-sm mb-6">short lines live in their own table, not the file shelf. paste /orlop in Discord for the card. rooms are just a name.</p>
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <input value={room} onChange={(e) => setRoom(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40))} onBlur={() => load(room || 'main')} placeholder="room" className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#ff9f0a]/40" />
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="name, optional" className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#ff9f0a]/40" />
          </div>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={500} placeholder="leave a line" className="w-full min-h-28 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#ff9f0a]/40" />
          <div className="flex flex-wrap gap-2 mt-3">
            <button onClick={leave} disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50">{busy ? 'leaving…' : 'leave the line'}</button>
            <button onClick={copyCard} className="px-5 py-2.5 rounded-full glass text-sm text-neutral-200">copy Discord card</button>
          </div>
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {copied && <p className="text-xs text-neutral-400 mt-4 break-all">copied: {copied}</p>}
        </motion.div>
        <div className="mt-4 space-y-2">
          {notes.map((note, i) => (
            <motion.article key={note.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 6) * 0.04, duration: 0.35 }} className="glass rounded-2xl px-4 py-3">
              <p className="text-sm text-white whitespace-pre-wrap">{note.body}</p>
              <p className="text-xs text-neutral-500 mt-2">{note.author || 'someone'} · {new Date(note.created_at).toLocaleString()}</p>
            </motion.article>
          ))}
          {!notes.length && <p className="text-sm text-neutral-500 px-1">this room is empty.</p>}
        </div>
      </div>
    </div>
  );
}
