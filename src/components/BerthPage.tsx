import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Berth = { id: string; slip: string; share_id: string | null; note: string | null; author: string | null; created_at: string };

export default function BerthPage() {
  const [file, setFile] = useState<File | null>(null);
  const [slip, setSlip] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [embed, setEmbed] = useState('');
  const [rows, setRows] = useState<Berth[]>([]);

  const load = async () => {
    const res = await fetch(`${SB_URL}/rest/v1/berths?select=id,slip,share_id,note,author,created_at&order=created_at.desc&limit=12`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data)) setRows(data);
  };

  useEffect(() => {
    load();
  }, []);

  const onFile = (next: File | null) => {
    setFile(next);
    setEmbed('');
    setError('');
    setWarn(next && next.size > 40 * 1024 * 1024 ? 'large file. nothing is blocked — the send may just feel slow.' : null);
    if (next && !slip) setSlip(next.name.replace(/\.[^.]+$/, '').slice(0, 80));
  };

  const send = async () => {
    if (!file || !slip.trim()) return;
    setBusy(true);
    setError('');
    const res = await publishLocalFile(file, { caption: note, author, color: '#0A84FF' });
    if (!res.ok || !res.id) {
      setBusy(false);
      setError(res.error || 'the berth did not take the file');
      return;
    }
    const id = Date.now().toString(36);
    const row = await fetch(`${SB_URL}/rest/v1/berths`, {
      method: 'POST',
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ id, slip: slip.trim().slice(0, 80), share_id: res.id, note: note || null, author: author || null }),
    });
    setBusy(false);
    if (!row.ok) {
      setError('file landed, slip name did not');
    }
    setWarn(res.warn || warn);
    setEmbed(res.embed || shareUrls(res.id).embed);
    setFile(null);
    setSlip('');
    setNote('');
    load();
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">berth</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">name the slip, then hand the file</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">A berth is a labelled place on the dock, not another vault drawer. The local file still goes into the share database and comes back as a Discord card.</p>
        </motion.div>
        <motion.label initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.06, duration: 0.5 }} className="glass mt-8 flex cursor-pointer flex-col items-center rounded-3xl px-6 py-12 text-center">
          <input type="file" className="sr-only" onChange={(e) => onFile(e.target.files?.[0] || null)} />
          <span className="text-[17px] font-medium">{file ? file.name : 'choose a local file'}</span>
          <span className="mt-1 text-[13px] text-white/45">{file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : 'no size cap'}</span>
        </motion.label>
        <div className="glass mt-3 rounded-3xl p-5">
          <input value={slip} onChange={(e) => setSlip(e.target.value)} placeholder="slip name" className="w-full rounded-2xl bg-black/30 px-4 py-3 text-[15px] outline-none placeholder:text-white/30" />
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="note on the card" className="mt-3 w-full rounded-2xl bg-black/30 px-4 py-3 text-[15px] outline-none placeholder:text-white/30" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="from" className="mt-3 w-full rounded-2xl bg-black/30 px-4 py-3 text-[15px] outline-none placeholder:text-white/30" />
          <button onClick={send} disabled={!file || !slip.trim() || busy} className="mt-4 rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-black disabled:opacity-50">{busy ? 'tying up…' : 'tie it up'}</button>
          {warn && <p className="mt-3 text-[13px] text-amber-200/80">{warn}</p>}
          {error && <p className="mt-3 text-[13px] text-red-300/90">{error}</p>}
          {embed && <p className="mt-3 truncate text-[13px] text-white/70">{embed}</p>}
        </div>
        <ul className="mt-6 space-y-2">
          {rows.map((row) => (
            <li key={row.id} className="glass flex items-center justify-between gap-3 rounded-2xl px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-[15px]">{row.slip}</p>
                <p className="truncate text-[12px] text-white/40">{row.note || row.author || 'unnamed hand'}</p>
              </div>
              {row.share_id && (
                <a href={`/s/${row.share_id}`} className="shrink-0 text-[13px] text-[#0a84ff]">card</a>
              )}
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
