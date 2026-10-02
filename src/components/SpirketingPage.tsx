import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

type Slip = {
  id: string;
  recipient: string;
  note: string;
  share_id: string | null;
  author: string | null;
  accent: string | null;
  created_at: string;
};

const SB = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function SpirketingPage() {
  const [recipient, setRecipient] = useState('');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [card, setCard] = useState('');
  const [copied, setCopied] = useState(false);
  const [slips, setSlips] = useState<Slip[]>([]);

  const slow = useMemo(() => {
    if (!file) return null;
    return file.size > 12 * 1024 * 1024
      ? 'heavy attachment. the send may feel slow. it is not refused.'
      : null;
  }, [file]);

  const load = async () => {
    const res = await fetch(
      `${SB}/rest/v1/spirkets?select=id,recipient,note,share_id,author,accent,created_at&order=created_at.desc&limit=12`,
      { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } },
    );
    if (!res.ok) return;
    const rows = await res.json();
    if (Array.isArray(rows)) setSlips(rows);
  };

  useEffect(() => {
    load();
    const raw = window.location.hash.split('?')[1] || '';
    const id = new URLSearchParams(raw).get('f');
    if (id) setCard(`${location.origin}/spirket/${id}`);
  }, []);

  const send = async () => {
    if (!recipient.trim() || !note.trim()) {
      setErr('a name and a line, then it can leave the desk');
      return;
    }
    setBusy(true);
    setErr('');
    let shareId: string | null = null;
    if (file) {
      const filed = await publishLocalFile(file, {
        caption: note.trim(),
        cardTitle: recipient.trim(),
        author: 'spirketing',
        color: '#0A84FF',
      });
      if (!filed.ok || !filed.id) {
        setBusy(false);
        setErr(filed.error || 'the share table did not take the file');
        return;
      }
      shareId = filed.id;
    }
    const id = uid();
    const row = {
      id,
      recipient: recipient.trim().slice(0, 80),
      note: note.trim().slice(0, 500),
      share_id: shareId,
      author: 'spirketing',
      accent: '#0A84FF',
    };
    const res = await fetch(`${SB}/rest/v1/spirkets`, {
      method: 'POST',
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(row),
    });
    setBusy(false);
    if (!res.ok) {
      setErr((await res.text()).slice(0, 180) || 'slip table refused the row');
      return;
    }
    setCard(`${location.origin}/spirket/${id}`);
    setNote('');
    setFile(null);
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
          <p className="text-[12px] tracking-[0.16em] uppercase text-white/45">handover, not a drawer</p>
          <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">spirketing</h1>
          <p className="mt-3 text-neutral-400 max-w-xl leading-relaxed">
            A short slip for someone else. An optional local file still lands in the share table. The link is the Discord card.
          </p>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="glass mt-8 rounded-3xl p-5 sm:p-6"
        >
          <input
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="who it is for"
            className="w-full rounded-2xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm outline-none focus:border-white/25"
          />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="the line they should read"
            rows={4}
            className="mt-3 w-full rounded-2xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm outline-none focus:border-white/25"
          />
          <label className="mt-3 block rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-5 text-center cursor-pointer">
            <input type="file" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <span className="text-sm text-neutral-200">{file ? file.name : 'optional local file'}</span>
            <span className="block mt-1 text-xs text-white/40">no size cutoff. slow sends are only warned.</span>
          </label>
          {slow && <p className="mt-3 text-sm text-amber-200/90">{slow}</p>}
          <button
            onClick={send}
            disabled={busy}
            className="mt-5 rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium disabled:opacity-40"
          >
            {busy ? 'filing' : 'file the slip'}
          </button>
          {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
        </motion.section>

        {card && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={copy}
            className="glass mt-4 w-full text-left rounded-3xl px-5 py-4"
          >
            <span className="block text-sm text-white">{copied ? 'copied' : 'discord card'}</span>
            <span className="block mt-1 text-xs text-white/50 break-all">{card}</span>
          </motion.button>
        )}

        <section className="mt-10 space-y-3">
          {slips.map((slip, i) => (
            <motion.a
              key={slip.id}
              href={`/spirket/${slip.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 8) * 0.04 }}
              className="glass block rounded-2xl px-4 py-3 hover:-translate-y-0.5 transition"
            >
              <p className="text-sm text-white">{slip.recipient}</p>
              <p className="mt-1 text-xs text-white/50 line-clamp-2">{slip.note}</p>
            </motion.a>
          ))}
        </section>
      </main>
    </div>
  );
}
