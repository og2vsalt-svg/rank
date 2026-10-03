import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Navbar from './Navbar';
import { useRouter } from './Router';

const SUPABASE_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

type Item = { id: string; name: string; mime: string; size: number; file_url: string };

export default function HawsePage() {
  const { shareId } = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState('several local files, one parcel row, one Discord card.');
  const [warn, setWarn] = useState('');
  const [card, setCard] = useState('');
  const [busy, setBusy] = useState(false);
  const [opened, setOpened] = useState<Item[] | null>(null);

  useEffect(() => {
    if (!shareId) return;
    fetch(`/api/parcel?id=${encodeURIComponent(shareId)}`)
      .then((r) => r.json())
      .then((row) => {
        if (row && Array.isArray(row.items)) {
          setOpened(row.items);
          setTitle(row.title || '');
          setNote(row.note || '');
          setStatus('parcel opened from the database.');
        }
      })
      .catch(() => setStatus('could not read that parcel.'));
  }, [shareId]);

  function pick(list: FileList | null) {
    const next = Array.from(list || []);
    setFiles(next);
    setCard('');
    const heavy = next.find((f) => f.size > 12 * 1024 * 1024);
    setWarn(heavy ? 'a large file is in the set. the tab may feel slow while it uploads. nothing is refused.' : '');
  }

  async function send() {
    if (!files.length) return;
    setBusy(true);
    const items: Item[] = [];
    for (const file of files) {
      setStatus(`sending ${file.name}…`);
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
        setStatus(`${file.name} did not land in storage.`);
        return;
      }
      items.push({
        id,
        name: file.name,
        mime: file.type || 'application/octet-stream',
        size: file.size,
        file_url: `${SUPABASE_URL}/storage/v1/object/public/shares/${path}`,
      });
    }
    setStatus('writing the parcel row…');
    const id = uid();
    const r = await fetch('/api/parcel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, title: title || 'hawse parcel', note, author, accent: '#0A84FF', items }),
    });
    const data = await r.json();
    setBusy(false);
    if (!r.ok) {
      setStatus(data.error || 'parcel row did not land');
      return;
    }
    const link = `${window.location.origin}/parcel/${data.id}`;
    setCard(link);
    setOpened(items);
    setStatus('parcel filed. paste the card link in Discord.');
  }

  return (
    <div className="mesh min-h-screen text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-20">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[#0a84ff] text-sm">parcel desk</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight">hawse</motion.h1>
        <p className="mt-4 text-neutral-400 text-lg max-w-xl">not a single vault slot. a handful of local files filed together, then one link that unfurls on Discord.</p>
        <motion.label initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mt-8 block rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-8 text-center cursor-pointer hover:border-[#0a84ff]/40 transition">
          <input type="file" multiple className="hidden" onChange={(e) => pick(e.target.files)} />
          <span className="text-neutral-200">{files.length ? `${files.length} file${files.length === 1 ? '' : 's'} ready` : 'choose local files'}</span>
        </motion.label>
        {warn && <p className="mt-3 text-sm text-amber-200/90">{warn}</p>}
        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="parcel title" className="rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name, optional" className="rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none" />
        </div>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="note on the Discord card" className="mt-3 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none" />
        <button disabled={!files.length || busy} onClick={send} className="mt-4 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">{busy ? 'filing' : 'file the parcel'}</button>
        <p className="mt-4 text-sm text-neutral-400">{status}</p>
        {card && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs text-neutral-500">Discord card</p>
            <a className="block mt-1 break-all text-[#0a84ff]" href={card}>{card}</a>
          </div>
        )}
        {opened && (
          <ul className="mt-6 space-y-2">
            {opened.map((it) => (
              <li key={it.id || it.name} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 flex items-center justify-between gap-3">
                <span className="truncate">{it.name}</span>
                <a className="text-sm text-[#0a84ff] shrink-0" href={it.file_url} target="_blank" rel="noreferrer">open</a>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
