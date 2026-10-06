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

type Slip = { id: string; body: string; author: string | null; reads: number; max_reads: number };

function rid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

const headers = {
  apikey: SB_KEY,
  Authorization: `Bearer ${SB_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

export default function QuietPage() {
  const { shareId } = useRouter();
  const [body, setBody] = useState('');
  const [author, setAuthor] = useState('');
  const [maxReads, setMaxReads] = useState(1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [opened, setOpened] = useState<Slip | null>(null);
  const [burned, setBurned] = useState(false);

  useEffect(() => {
    if (!shareId) return;
    let stop = false;
    (async () => {
      const res = await fetch(`${SB_URL}/rest/v1/quiet_slips?id=eq.${encodeURIComponent(shareId)}&select=*&limit=1`, {
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
      });
      if (!res.ok || stop) return;
      const rows = await res.json();
      const row = Array.isArray(rows) && rows[0] ? rows[0] as Slip : null;
      if (!row) return;
      if (row.reads >= row.max_reads) {
        setBurned(true);
        return;
      }
      setOpened(row);
      await fetch(`${SB_URL}/rest/v1/quiet_slips?id=eq.${encodeURIComponent(shareId)}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ reads: row.reads + 1 }),
      });
    })();
    return () => {
      stop = true;
    };
  }, [shareId]);

  async function send() {
    setErr('');
    if (!body.trim()) return setErr('write something first');
    setBusy(true);
    try {
      const id = rid();
      const res = await fetch(`${SB_URL}/rest/v1/quiet_slips`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          id,
          body: body.trim(),
          author: author.trim() || null,
          reads: 0,
          max_reads: maxReads,
        }),
      });
      if (!res.ok) throw new Error((await res.text()).slice(0, 180) || 'could not file the slip');
      const app = `${location.origin}/quiet/${id}`;
      setLink(app);
      try { await navigator.clipboard.writeText(app); } catch { /* optional */ }
    } catch (e: any) {
      setErr(e?.message || 'could not file the slip');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-xl mx-auto px-5 pt-24 pb-20">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-xs uppercase tracking-[0.18em] text-[#bf5af2] mb-2">quiet</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">a note that burns</h1>
          <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
            Not a file drawer. A short slip in the database, readable a set number of times, then gone. Discord gets a card with the author only — the text stays off the preview.
          </p>
        </motion.div>

        {burned && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-3xl p-5 text-sm text-neutral-400 mb-6">
            this slip has already been read.
          </motion.p>
        )}

        {opened && (
          <motion.article initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-5 mb-6">
            <p className="text-xs text-neutral-500 mb-2">{opened.author || 'unsigned'}</p>
            <p className="text-sm text-neutral-100 whitespace-pre-wrap leading-relaxed">{opened.body}</p>
          </motion.article>
        )}

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="glass rounded-3xl p-5">
          <textarea value={body} onChange={(e) => setBody(e.target.value.slice(0, 4000))} placeholder="the note" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none min-h-32 mb-3" />
          <input value={author} onChange={(e) => setAuthor(e.target.value.slice(0, 80))} placeholder="your name, optional" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none mb-4" />
          <label className="block text-xs text-neutral-500 mb-4">
            reads before it burns
            <input type="number" min={1} max={20} value={maxReads} onChange={(e) => setMaxReads(Math.max(1, Math.min(20, Number(e.target.value) || 1)))} className="mt-1 w-24 rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-white" />
          </label>
          {err && <p className="text-xs text-rose-300 mb-3">{err}</p>}
          {link && <p className="text-xs text-[#64d2ff] mb-3 break-all">{link}</p>}
          <button type="button" disabled={busy} onClick={send} className="w-full rounded-full bg-white text-black text-sm font-medium py-2.5 disabled:opacity-50 active:scale-[0.98] transition">
            {busy ? 'filing…' : 'file the slip'}
          </button>
        </motion.div>
      </main>
    </div>
  );
}
