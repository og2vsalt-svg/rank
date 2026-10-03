import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Whisper = { id: string; body: string; author: string | null; created_at: string; kind: string | null };

function headers() {
  return {
    apikey: SB_KEY,
    Authorization: `Bearer ${SB_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
}

export default function LanternPage() {
  const [body, setBody] = useState('');
  const [author, setAuthor] = useState('');
  const [rows, setRows] = useState<Whisper[]>([]);
  const [status, setStatus] = useState('a short note. no file, no drawer.');
  const [busy, setBusy] = useState(false);

  async function load() {
    const r = await fetch(`${SB_URL}/rest/v1/whispers?select=id,body,author,created_at,kind&order=created_at.desc&limit=24`, { headers: headers() });
    const data = await r.json();
    if (r.ok && Array.isArray(data)) setRows(data);
    else setStatus('the lantern could not read notes');
  }

  useEffect(() => {
    load().catch(() => setStatus('the lantern could not read notes'));
  }, []);

  async function leave() {
    const text = body.trim();
    if (!text || busy) return;
    if (text.length > 280) {
      setStatus('keep it under 280 characters. that is a note length, not a file cap.');
      return;
    }
    setBusy(true);
    const r = await fetch(`${SB_URL}/rest/v1/whispers`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ body: text, author: author.trim().slice(0, 80) || 'lantern', kind: 'status' }),
    });
    setBusy(false);
    if (!r.ok) {
      setStatus('that note did not land');
      return;
    }
    setBody('');
    setStatus('left on the lantern. paste /lantern in Discord for the card.');
    await load();
  }

  return (
    <div className="mesh min-h-screen text-white">
      <Navbar />
      <main className="max-w-2xl mx-auto px-5 pt-28 pb-24">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] tracking-[0.16em] uppercase text-[#ffd60a]">lantern</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="mt-2 text-[44px] font-semibold tracking-[-0.045em]">Leave a light on.</motion.h1>
        <p className="mt-3 text-[16px] text-white/60">A board of short notes in the whispers table. Files stay on shuttle, folio, and passage.</p>
        <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
          <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={280} placeholder="what should the next person see" className="min-h-28 w-full resize-none bg-transparent text-[16px] outline-none" />
          <div className="mt-3 flex items-center gap-3">
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="name" className="flex-1 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-[14px] outline-none" />
            <button onClick={leave} disabled={busy || !body.trim()} className="rounded-full bg-white px-4 py-2 text-[14px] font-medium text-black disabled:opacity-40">{busy ? 'leaving' : 'leave it'}</button>
          </div>
          <p className="mt-3 text-[12px] text-white/40">{body.length}/280 · {status}</p>
        </div>
        <ul className="mt-6 space-y-2">
          {rows.map((row, i) => (
            <motion.li key={row.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04 }} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <p className="text-[15px] leading-relaxed text-white/85">{row.body}</p>
              <p className="mt-1 text-[12px] text-white/35">{row.author || 'someone'} · {new Date(row.created_at).toLocaleString()}</p>
            </motion.li>
          ))}
        </ul>
      </main>
    </div>
  );
}
