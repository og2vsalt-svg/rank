import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type LinkRow = { id: string; url: string; note: string | null; author: string | null; created_at: string };

export default function LimberPage() {
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<LinkRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState<string | null>(null);
  const [card, setCard] = useState('');

  const load = async () => {
    const res = await fetch(`${SB_URL}/rest/v1/links?select=id,url,note,author,created_at&order=created_at.desc&limit=12`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data)) setRows(data);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    const clean = url.trim();
    if (!/^https?:\/\//i.test(clean)) {
      setError('start the link with http');
      return;
    }
    setBusy(true);
    setError('');
    setCard('');
    const res = await fetch(`${SB_URL}/rest/v1/links`, {
      method: 'POST',
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ url: clean, note: note.trim() || null, author: author.trim() || null }),
    });
    if (!res.ok) {
      setBusy(false);
      setError('the shelf did not take that link');
      return;
    }
    if (file) {
      if (file.size > 30 * 1024 * 1024) setWarn('large companion file. nothing is refused, the send may just feel slow.');
      const filed = await publishLocalFile(file, {
        caption: note.trim() || clean,
        author: author.trim() || 'limber',
        color: '#64D2FF',
      });
      if (filed.ok && filed.id) setCard(filed.embed || shareUrls(filed.id).embed);
      else setError(filed.error || 'link saved, file did not');
      setWarn(filed.warn || null);
    }
    setBusy(false);
    setUrl('');
    setNote('');
    setFile(null);
    load();
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">limber</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">a shelf, not a cabinet</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">Park a link on the shared shelf. If a local file should travel with it, that file goes into the share table and you get a Discord card. The shelf itself stays a list of addresses.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="glass mt-8 rounded-3xl p-5">
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" className="w-full rounded-2xl bg-black/30 px-4 py-3 text-[15px] outline-none placeholder:text-white/30" />
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="why it is here" rows={2} className="mt-3 w-full resize-none rounded-2xl bg-black/30 px-4 py-3 text-[15px] outline-none placeholder:text-white/30" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="signed" className="mt-3 w-full rounded-2xl bg-black/30 px-4 py-3 text-[15px] outline-none placeholder:text-white/30" />
          <label className="mt-3 flex cursor-pointer items-center justify-between rounded-2xl bg-black/30 px-4 py-3 text-[14px] text-white/70">
            <span>{file ? file.name : 'optional file to send with it'}</span>
            <input type="file" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          <button onClick={save} disabled={busy} className="mt-4 rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-black transition hover:bg-neutral-200 disabled:opacity-50">{busy ? 'setting it down…' : 'put it on the shelf'}</button>
          {warn && <p className="mt-3 text-[13px] text-amber-200/80">{warn}</p>}
          {error && <p className="mt-3 text-[13px] text-red-300/90">{error}</p>}
          {card && <p className="mt-3 truncate text-[13px] text-white/70">discord card {card}</p>}
        </motion.div>
        <div className="mt-6 space-y-2">
          {rows.map((row) => (
            <a key={row.id} href={row.url} target="_blank" rel="noreferrer" className="block rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 transition hover:bg-white/[0.06]">
              <p className="truncate text-[14px] text-white">{row.note || row.url}</p>
              <p className="mt-1 truncate text-[12px] text-white/40">{row.url}{row.author ? ` · ${row.author}` : ''}</p>
            </a>
          ))}
          {rows.length === 0 && <p className="px-1 text-[13px] text-white/35">the shelf is empty for now.</p>}
        </div>
      </main>
    </div>
  );
}
