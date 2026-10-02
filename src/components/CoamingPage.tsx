import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

const SB_URL = (
  (import.meta as any).env?.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co'
).replace(/\/$/, '');
const SB_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Sitting = { id: string; title: string; body: string; created_at: string };

function minutesLabel(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function CoamingPage() {
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [note, setNote] = useState('');
  const [sittings, setSittings] = useState<Sitting[]>([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setSeconds((n) => (n <= 1 ? 0 : n - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (seconds === 0) setRunning(false);
  }, [seconds]);

  const load = async () => {
    const res = await fetch(
      `${SB_URL}/rest/v1/keel_marks?page_ref=eq.coaming&select=id,title,body,created_at&order=created_at.desc&limit=12`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } },
    );
    if (!res.ok) return;
    const rows = await res.json();
    if (Array.isArray(rows)) setSittings(rows);
  };

  useEffect(() => {
    load();
  }, []);

  const ring = useMemo(() => {
    const total = 25 * 60;
    const left = Math.min(1, seconds / total);
    return `conic-gradient(#0A84FF ${left * 360}deg, rgba(255,255,255,0.08) 0deg)`;
  }, [seconds]);

  const fileNote = async () => {
    if (!note.trim()) return;
    setBusy(true);
    setErr('');
    const res = await fetch(`${SB_URL}/rest/v1/keel_marks`, {
      method: 'POST',
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        title: `sitting ${minutesLabel(25 * 60 - seconds)}`,
        body: note.trim().slice(0, 4000),
        page_ref: 'coaming',
        author: 'coaming',
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setErr('the sitting note did not land');
      return;
    }
    setNote('');
    load();
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-24 pb-20">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] tracking-[0.16em] uppercase text-white/45">sitting</p>
          <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">coaming</h1>
          <p className="mt-3 text-neutral-400 max-w-xl leading-relaxed">
            A quiet twenty-five. The clock stays in the tab. The note, if you keep it, goes to the reading table — not the file vault. <span className="text-white/80">/coaming</span> unfurls on Discord.
          </p>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="glass mt-8 rounded-3xl p-6 sm:p-8 flex flex-col items-center"
        >
          <div className="h-44 w-44 rounded-full p-2" style={{ background: ring }}>
            <div className="h-full w-full rounded-full bg-[#0b0b0d] flex items-center justify-center">
              <span className="text-4xl font-semibold tracking-tight tabular-nums">{minutesLabel(seconds)}</span>
            </div>
          </div>
          <div className="mt-6 flex gap-2">
            <button onClick={() => setRunning((v) => !v)} className="rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium">
              {running ? 'pause' : 'start'}
            </button>
            <button
              onClick={() => {
                setRunning(false);
                setSeconds(25 * 60);
              }}
              className="rounded-full bg-white/10 text-white px-5 py-2.5 text-sm"
            >
              reset
            </button>
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="what this sitting was for"
            rows={3}
            className="mt-6 w-full rounded-2xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm outline-none focus:border-white/25"
          />
          <button
            onClick={fileNote}
            disabled={!note.trim() || busy}
            className="mt-3 rounded-full bg-white/10 text-white px-5 py-2.5 text-sm disabled:opacity-40"
          >
            {busy ? 'keeping' : 'keep the note'}
          </button>
          {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
        </motion.section>

        <div className="mt-4 space-y-2">
          {sittings.map((row) => (
            <article key={row.id} className="glass rounded-2xl px-4 py-3">
              <p className="text-sm text-white">{row.title}</p>
              <p className="mt-1 text-sm text-neutral-400 whitespace-pre-wrap">{row.body}</p>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
