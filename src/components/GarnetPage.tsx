import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

const KINDS = ['status', 'wip', 'feedback', 'tip', 'collab'] as const;

type Whisper = { id: string; body: string; author: string | null; kind: string | null; created_at: string };

export default function GarnetPage() {
  const [body, setBody] = useState('');
  const [author, setAuthor] = useState('');
  const [kind, setKind] = useState<(typeof KINDS)[number]>('status');
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Whisper[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState<string | null>(null);
  const [card, setCard] = useState('');

  const load = async () => {
    const res = await fetch(`${SB_URL}/rest/v1/whispers?select=id,body,author,kind,created_at&order=created_at.desc&limit=16`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data)) setRows(data);
  };

  useEffect(() => { load(); }, []);

  const pin = async () => {
    const text = body.trim();
    if (!text) return;
    if (text.length > 280) {
      setError('keep the line under 280 characters. the file can be as large as you like.');
      return;
    }
    setBusy(true);
    setError('');
    setCard('');
    const res = await fetch(`${SB_URL}/rest/v1/whispers`, {
      method: 'POST',
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ body: text, author: author.trim() || null, kind }),
    });
    if (!res.ok) {
      setBusy(false);
      setError('the wall did not take that line');
      return;
    }
    if (file) {
      if (file.size > 28 * 1024 * 1024) setWarn('large pin. the wall note is already saved. the file send may take a moment.');
      const filed = await publishLocalFile(file, {
        caption: text,
        author: author.trim() || 'garnet',
        color: '#FF375F',
      });
      if (filed.ok && filed.id) setCard(filed.embed || shareUrls(filed.id).embed);
      else setError(filed.error || 'note saved, file did not');
      setWarn(filed.warn || null);
    }
    setBusy(false);
    setBody('');
    setFile(null);
    load();
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">garnet</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">a line on the wall</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">Short notes live in the whisper table. A local file, if you pin one, is uploaded beside the line and handed out as a Discord card. No size ceiling on the file — only a warning if it will feel slow.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="glass mt-8 rounded-3xl p-5">
          <div className="flex flex-wrap gap-2">
            {KINDS.map((k) => (
              <button key={k} onClick={() => setKind(k)} className={`rounded-full px-3.5 py-1.5 text-[13px] transition ${kind === k ? 'bg-white text-black' : 'bg-white/8 text-white/70 hover:bg-white/12'}`}>{k}</button>
            ))}
          </div>
          <textarea value={body} onChange={(e) => setBody(e.target.value.slice(0, 280))} placeholder="a short line" rows={3} className="mt-3 w-full resize-none rounded-2xl bg-black/30 px-4 py-3 text-[15px] outline-none placeholder:text-white/30" />
          <p className="mt-1 text-right text-[11px] text-white/35">{body.length}/280</p>
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="signed" className="mt-2 w-full rounded-2xl bg-black/30 px-4 py-3 text-[15px] outline-none placeholder:text-white/30" />
          <label className="mt-3 flex cursor-pointer items-center justify-between rounded-2xl bg-black/30 px-4 py-3 text-[14px] text-white/70">
            <span>{file ? file.name : 'optional file to pin'}</span>
            <input type="file" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          <button onClick={pin} disabled={busy || !body.trim()} className="mt-4 rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-black transition hover:bg-neutral-200 disabled:opacity-50">{busy ? 'pinning…' : 'pin it'}</button>
          {warn && <p className="mt-3 text-[13px] text-amber-200/80">{warn}</p>}
          {error && <p className="mt-3 text-[13px] text-red-300/90">{error}</p>}
          {card && <p className="mt-3 truncate text-[13px] text-white/70">discord card {card}</p>}
        </motion.div>
        <div className="mt-6 space-y-2">
          {rows.map((row) => (
            <article key={row.id} className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
              <p className="text-[14px] leading-relaxed text-white">{row.body}</p>
              <p className="mt-1 text-[12px] text-white/40">{row.kind || 'status'}{row.author ? ` · ${row.author}` : ''}</p>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
