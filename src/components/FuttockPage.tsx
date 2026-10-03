import { motion } from 'framer-motion';
import { useState } from 'react';
import Navbar from './Navbar';

const SUPABASE_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function FuttockPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [caption, setCaption] = useState('');
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState('a reading desk. text and notes stay readable after the file is filed.');
  const [warn, setWarn] = useState('');
  const [card, setCard] = useState('');
  const [busy, setBusy] = useState(false);

  function pick(next: File | null) {
    setFile(next);
    setCard('');
    setPreview('');
    if (!next) return;
    if (next.size > 12 * 1024 * 1024) setWarn('large drop. preview may feel slow. the file is still accepted.');
    else setWarn('');
    if (next.type.startsWith('text/') || /\.(md|txt|csv|json)$/i.test(next.name)) {
      next.slice(0, 8000).text().then(setPreview).catch(() => setPreview(''));
    }
  }

  async function send() {
    if (!file) return;
    setBusy(true);
    setStatus('sending the file to storage…');
    const id = uid();
    const safe = file.name.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 180) || 'file';
    const path = `${id}/${safe}`;
    const up = await fetch(`${SUPABASE_URL}/storage/v1/object/shares/${path}`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': file.type || 'application/octet-stream',
        'x-upsert': 'true',
      },
      body: file,
    });
    if (!up.ok) {
      setBusy(false);
      setStatus('storage did not take it.');
      return;
    }
    const fileUrl = `${SUPABASE_URL}/storage/v1/object/public/shares/${path}`;
    const r = await fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        name: file.name,
        type: file.type || 'text/plain',
        size: file.size,
        fileUrl,
        caption: caption || preview.slice(0, 180),
        author,
        cardTitle: file.name,
        color: '#5E5CE6',
      }),
    });
    const data = await r.json();
    setBusy(false);
    if (!r.ok) {
      setStatus(data.error || 'the row did not land');
      return;
    }
    setCard(`${window.location.origin}${data.embedPath}`);
    setStatus(data.warn || 'filed. the excerpt rides on the Discord card.');
  }

  return (
    <div className="mesh min-h-screen text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-20">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[#5e5ce6] text-sm">reading desk</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight">futtock</motion.h1>
        <p className="mt-4 text-neutral-400 text-lg max-w-xl">drop a note, markdown, or csv. the opening lines stay on the page and on the Discord card. no size cap.</p>
        <motion.label initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-8 block rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-8 text-center cursor-pointer hover:border-[#5e5ce6]/40 transition">
          <input type="file" className="hidden" onChange={(e) => pick(e.target.files?.[0] || null)} />
          <span className="text-neutral-200">{file ? file.name : 'choose a text file'}</span>
        </motion.label>
        {warn && <p className="mt-3 text-sm text-amber-200/90">{warn}</p>}
        {preview && <pre className="mt-4 max-h-48 overflow-auto rounded-2xl bg-black/40 border border-white/10 p-4 text-sm text-neutral-300 whitespace-pre-wrap">{preview}</pre>}
        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="card caption, or leave the excerpt" className="rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name, optional" className="rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none" />
        </div>
        <button disabled={!file || busy} onClick={send} className="mt-4 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">{busy ? 'filing' : 'file the note'}</button>
        <p className="mt-4 text-sm text-neutral-400">{status}</p>
        {card && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs text-neutral-500">Discord card</p>
            <a className="block mt-1 break-all text-[#5e5ce6]" href={card}>{card}</a>
          </div>
        )}
      </main>
    </div>
  );
}
