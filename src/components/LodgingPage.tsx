import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';

const SB_URL = (
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  'https://tqfocdktvjuwoiyfgesb.supabase.co'
).replace(/\/$/, '');
const SB_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

type Stay = {
  id: string;
  line: string;
  wake_at: string | null;
  author: string | null;
  hue: string | null;
  created_at: string;
};

function wakeLabel(value: string | null) {
  if (!value) return 'no wake set';
  const t = new Date(value);
  if (Number.isNaN(t.getTime())) return 'no wake set';
  return t.getTime() > Date.now() ? `wake ${t.toLocaleString()}` : `awake since ${t.toLocaleString()}`;
}

export default function LodgingPage() {
  const { shareId } = useRouter();
  const [line, setLine] = useState('');
  const [wakeAt, setWakeAt] = useState('');
  const [author, setAuthor] = useState('');
  const [hue, setHue] = useState('#FFD60A');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [row, setRow] = useState<Stay | null>(null);
  const [recent, setRecent] = useState<Stay[]>([]);

  const loadRecent = async () => {
    const res = await fetch(
      `${SB_URL}/rest/v1/lodgings?select=id,line,wake_at,author,hue,created_at&order=created_at.desc&limit=10`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } },
    );
    if (!res.ok) return;
    const rows = await res.json();
    if (Array.isArray(rows)) setRecent(rows);
  };

  const loadOne = async (id: string) => {
    const res = await fetch(
      `${SB_URL}/rest/v1/lodgings?id=eq.${encodeURIComponent(id)}&select=*&limit=1`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } },
    );
    if (!res.ok) return;
    const rows = await res.json();
    if (Array.isArray(rows) && rows[0]) setRow(rows[0]);
  };

  useEffect(() => {
    loadRecent();
    if (shareId) loadOne(shareId);
  }, [shareId]);

  const send = async () => {
    if (!line.trim()) return;
    setBusy(true);
    setError('');
    const id = uid();
    const next = {
      id,
      line: line.trim().slice(0, 280),
      wake_at: wakeAt ? new Date(wakeAt).toISOString() : null,
      author: author.trim() || null,
      hue,
    };
    const ins = await fetch(`${SB_URL}/rest/v1/lodgings`, {
      method: 'POST',
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(next),
    });
    setBusy(false);
    if (!ins.ok) {
      setError(`lodging ${ins.status}: ${(await ins.text()).slice(0, 180)}`);
      return;
    }
    const saved = await ins.json();
    setRow(Array.isArray(saved) ? saved[0] : { ...next, created_at: new Date().toISOString() });
    setLine('');
    loadRecent();
    history.pushState(null, '', `/lodging/${id}`);
  };

  const copy = async (value: string) => {
    try { await navigator.clipboard.writeText(value); } catch { setError(value); }
  };

  const card = row ? `${location.origin}/lodging/${row.id}` : '';
  const sleeping = row?.wake_at ? new Date(row.wake_at).getTime() > Date.now() : false;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#ffd60a] text-sm font-medium mb-2 tracking-wide">lodging</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-3">leave a line overnight.</h1>
          <p className="text-neutral-400 max-w-xl mb-8">not a file desk. a short stay on the board, with an optional wake time. the time is a note, not a lock. paste /lodging in Discord for the card. the older file desks stay where they are.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-3xl p-6 sm:p-8">
          <textarea value={line} onChange={(e) => setLine(e.target.value)} placeholder="the line to leave" maxLength={280} rows={4} className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#ffd60a]/50 resize-none" />
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            <label className="text-xs text-neutral-500">
              wake, optional
              <input type="datetime-local" value={wakeAt} onChange={(e) => setWakeAt(e.target.value)} className="mt-1 w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-[#ffd60a]/50" />
            </label>
            <label className="text-xs text-neutral-500">
              your name, optional
              <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="who left it" className="mt-1 w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-[#ffd60a]/50" />
            </label>
          </div>
          <label className="mt-3 flex items-center gap-3 text-sm text-neutral-400">
            accent
            <input type="color" value={hue} onChange={(e) => setHue(e.target.value)} className="h-8 w-10 rounded-lg bg-transparent border-0" />
            <span className="text-xs text-neutral-500">{hue}</span>
          </label>
          {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
          <button disabled={!line.trim() || busy} onClick={send} className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 active:scale-[0.98] transition">
            {busy ? 'settling…' : 'leave the line'}
          </button>
        </motion.div>

        {row && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6 mt-5">
            <p className="text-white font-medium">{row.line}</p>
            <p className="text-sm text-neutral-400 mt-1">{wakeLabel(row.wake_at)}{row.author ? ` · ${row.author}` : ''}</p>
            {sleeping && <p className="text-xs text-amber-200/80 mt-2">the wake has not come. the line is still readable — the time is a note, not a gate.</p>}
            <p className="text-xs text-neutral-500 mt-2 break-all">{card}</p>
            <button onClick={() => copy(card)} className="mt-4 text-xs px-3 py-1.5 rounded-full bg-white text-black">copy Discord link</button>
          </motion.div>
        )}

        {recent.length > 0 && (
          <div className="mt-8">
            <p className="text-xs uppercase tracking-wide text-neutral-500 mb-3">on the board</p>
            <div className="grid gap-2">
              {recent.map((item, i) => (
                <motion.a key={item.id} href={`/lodging/${item.id}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="glass rounded-2xl px-4 py-3 hover:bg-white/[0.04] transition duration-200">
                  <p className="text-white text-sm">{item.line}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{wakeLabel(item.wake_at)}</p>
                </motion.a>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
