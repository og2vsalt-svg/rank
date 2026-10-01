import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

const SB_URL = (
  (import.meta as any).env?.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co'
).replace(/\/$/, '');
const SB_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Row = { name: string; id: string; warn?: string | null; error?: string };

export default function RudderPage() {
  const [title, setTitle] = useState('handoff');
  const [note, setNote] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [letter, setLetter] = useState('');

  const send = async () => {
    setErr('');
    if (!note.trim() && !files.length) {
      setErr('write a note or attach a local file');
      return;
    }
    setBusy(true);
    const landed: Row[] = [];
    for (const file of files) {
      const res = await publishLocalFile(file, { caption: title.trim() || 'handoff' });
      landed.push(res.ok && res.id ? { name: file.name, id: res.id, warn: res.warn } : { name: file.name, id: '', error: res.error || 'missed' });
    }
    const ids = landed.filter((r) => r.id).map((r) => r.id);
    const body = [
      `# ${title.trim() || 'handoff'}`,
      '',
      note.trim(),
      '',
      ...ids.map((id) => `- ${shareUrls(id).embed}`),
    ].join('\n');
    const letterFile = new File([body], `${(title.trim() || 'handoff').replace(/\s+/g, '-')}.md`, { type: 'text/markdown' });
    const letterRes = await publishLocalFile(letterFile, { caption: note.trim().slice(0, 160) || 'handoff' });
    if (letterRes.ok && letterRes.id) {
      setLetter(letterRes.id);
      try {
        await fetch(`${SB_URL}/rest/v1/handoffs`, {
          method: 'POST',
          headers: {
            apikey: SB_KEY,
            Authorization: `Bearer ${SB_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({
            id: letterRes.id,
            share_id: letterRes.id,
            title: title.trim() || 'handoff',
            note: note.trim(),
            share_ids: ids,
          }),
        });
      } catch {
        // the public file row is the source of truth for the card
      }
    } else if (!landed.length) {
      setErr(letterRes.error || 'could not write the handoff');
    }
    setRows(landed);
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">rudder</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">hand off a note and its files</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">
            Locals upload into the share database. A short letter lists every Discord card, and that letter is stored as its own row.
          </p>
        </motion.div>
        <div className="mt-8 space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="glass w-full rounded-2xl px-4 py-3 text-[14px] outline-none" placeholder="title" />
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={5} className="glass w-full rounded-3xl px-4 py-3 text-[14px] outline-none" placeholder="what the other person should know" />
          <label className="glass block cursor-pointer rounded-3xl px-4 py-6 text-center text-[14px] text-white/70">
            {files.length ? `${files.length} local file${files.length === 1 ? '' : 's'}` : 'attach locals'}
            <input type="file" multiple className="hidden" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
          </label>
          {files.some((f) => f.size > 12 * 1024 * 1024) && (
            <p className="text-[13px] text-amber-200">one of these is large. the send may feel slow. there is no cap.</p>
          )}
          <button onClick={send} disabled={busy} className="rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-black transition-transform active:scale-[0.98] disabled:opacity-60">
            {busy ? 'handing off…' : 'hand off'}
          </button>
          {err && <p className="text-[13px] text-red-300">{err}</p>}
          {letter && (
            <div className="glass rounded-3xl p-5 text-[13px]">
              <p className="text-white/50">letter card</p>
              <p className="mt-1 break-all">{shareUrls(letter).embed}</p>
            </div>
          )}
          {rows.map((r) => (
            <div key={r.name} className="glass rounded-2xl px-4 py-3 text-[13px]">
              <p className="font-medium">{r.name}</p>
              {r.id ? <p className="mt-1 break-all text-white/70">{shareUrls(r.id).embed}</p> : <p className="mt-1 text-red-300">{r.error}</p>}
              {r.warn && <p className="mt-1 text-amber-200">{r.warn}</p>}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
