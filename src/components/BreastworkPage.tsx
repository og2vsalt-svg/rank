import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

type Pair = {
  id: string;
  title: string;
  left_name: string | null;
  right_name: string | null;
  note: string | null;
  created_at: string;
};

const SB = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function BreastworkPage() {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [left, setLeft] = useState<File | null>(null);
  const [right, setRight] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [card, setCard] = useState('');
  const [copied, setCopied] = useState(false);
  const [rows, setRows] = useState<Pair[]>([]);

  const slow = useMemo(() => {
    const size = (left?.size || 0) + (right?.size || 0);
    return size > 16 * 1024 * 1024 ? 'heavy pair. the send may feel slow. neither file is refused.' : null;
  }, [left, right]);

  const load = async () => {
    const res = await fetch(
      `${SB}/rest/v1/breastworks?select=id,title,left_name,right_name,note,created_at&order=created_at.desc&limit=10`,
      { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } },
    );
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data)) setRows(data);
  };

  useEffect(() => {
    load();
  }, []);

  const fileIt = async () => {
    if (!title.trim()) {
      setErr('name the pair first');
      return;
    }
    if (!left && !right) {
      setErr('at least one local file, so the pair has a side');
      return;
    }
    setBusy(true);
    setErr('');
    let leftId: string | null = null;
    let rightId: string | null = null;
    if (left) {
      const filed = await publishLocalFile(left, { caption: note.trim(), cardTitle: title.trim() + ' left', author: 'breastwork', color: '#0A84FF' });
      if (!filed.ok || !filed.id) {
        setBusy(false);
        setErr(filed.error || 'left file did not land');
        return;
      }
      leftId = filed.id;
    }
    if (right) {
      const filed = await publishLocalFile(right, { caption: note.trim(), cardTitle: title.trim() + ' right', author: 'breastwork', color: '#0A84FF' });
      if (!filed.ok || !filed.id) {
        setBusy(false);
        setErr(filed.error || 'right file did not land');
        return;
      }
      rightId = filed.id;
    }
    const id = uid();
    const res = await fetch(`${SB}/rest/v1/breastworks`, {
      method: 'POST',
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        id,
        title: title.trim().slice(0, 120),
        left_share: leftId,
        right_share: rightId,
        left_name: left?.name || null,
        right_name: right?.name || null,
        note: note.trim().slice(0, 400) || null,
        accent: '#0A84FF',
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setErr((await res.text()).slice(0, 180) || 'pair table refused the row');
      return;
    }
    setCard(`${location.origin}/breastwork/${id}`);
    setLeft(null);
    setRight(null);
    setNote('');
    load();
  };

  const copy = async () => {
    if (!card) return;
    await navigator.clipboard.writeText(card);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-24 pb-20">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] tracking-[0.16em] uppercase text-white/45">a pair, not a cabinet</p>
          <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">breastwork</h1>
          <p className="mt-3 text-neutral-400 max-w-xl leading-relaxed">
            Two local files, filed side by side into the share database. Each side keeps its own Discord card. The pair link unfurls the note.
          </p>
        </motion.div>
        <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="glass mt-8 rounded-3xl p-5 sm:p-6">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="what the pair is called" className="w-full rounded-2xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm outline-none focus:border-white/25" />
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="why these two sit together" rows={3} className="mt-3 w-full rounded-2xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm outline-none focus:border-white/25" />
          <div className="mt-3 grid sm:grid-cols-2 gap-3">
            <label className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-5 text-center cursor-pointer">
              <input type="file" className="sr-only" onChange={(e) => setLeft(e.target.files?.[0] || null)} />
              <span className="text-sm text-neutral-200">{left ? left.name : 'left file'}</span>
            </label>
            <label className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-5 text-center cursor-pointer">
              <input type="file" className="sr-only" onChange={(e) => setRight(e.target.files?.[0] || null)} />
              <span className="text-sm text-neutral-200">{right ? right.name : 'right file'}</span>
            </label>
          </div>
          <p className="mt-2 text-xs text-white/40">no size cutoff. a slow pair is only warned.</p>
          {slow && <p className="mt-3 text-sm text-amber-200/90">{slow}</p>}
          <button onClick={fileIt} disabled={busy} className="mt-5 rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium disabled:opacity-40">{busy ? 'filing both' : 'file the pair'}</button>
          {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
        </motion.section>
        {card && (
          <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} onClick={copy} className="glass mt-4 w-full text-left rounded-3xl px-5 py-4">
            <span className="block text-sm text-white">{copied ? 'copied' : 'discord card'}</span>
            <span className="block mt-1 text-xs text-white/50 break-all">{card}</span>
          </motion.button>
        )}
        <section className="mt-10 space-y-3">
          {rows.map((row, i) => (
            <motion.a key={row.id} href={`/breastwork/${row.id}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04 }} className="glass block rounded-2xl px-4 py-3 hover:-translate-y-0.5 transition">
              <p className="text-sm text-white">{row.title}</p>
              <p className="mt-1 text-xs text-white/50">{[row.left_name, row.right_name].filter(Boolean).join(' / ') || row.note}</p>
            </motion.a>
          ))}
        </section>
      </main>
    </div>
  );
}
