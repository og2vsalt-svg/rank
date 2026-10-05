import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { publishLocalFile } from '../lib/cloudShare';

const SB_URL = (
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  'https://tqfocdktvjuwoiyfgesb.supabase.co'
).replace(/\/$/, '');
const SB_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Shelf = {
  id: string;
  title: string;
  note: string;
  share_id: string | null;
  file_name: string | null;
  mime: string | null;
  size: number;
  author: string | null;
  created_at: string;
};

function pretty(n: number) {
  if (!n) return '0 B';
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

async function listShelves(): Promise<Shelf[]> {
  const res = await fetch(
    `${SB_URL}/rest/v1/binnacle_shelves?select=id,title,note,share_id,file_name,mime,size,author,created_at&order=created_at.desc&limit=12`,
    { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } },
  );
  if (!res.ok) return [];
  const rows = await res.json();
  return Array.isArray(rows) ? rows : [];
}

export default function NightglassPage() {
  const { shareId } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [rows, setRows] = useState<Shelf[]>([]);
  const [open, setOpen] = useState<Shelf | null>(null);

  const slow = useMemo(
    () => (file && file.size > 24 * 1024 * 1024 ? 'this file is large. the send may feel slow. nothing is refused for size.' : ''),
    [file],
  );

  useEffect(() => {
    listShelves().then(setRows).catch(() => setRows([]));
  }, []);

  useEffect(() => {
    if (!shareId) {
      setOpen(null);
      return;
    }
    fetch(
      `${SB_URL}/rest/v1/binnacle_shelves?id=eq.${encodeURIComponent(shareId)}&select=*&limit=1`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } },
    )
      .then((r) => r.json())
      .then((rows) => setOpen(Array.isArray(rows) ? rows[0] || null : null))
      .catch(() => setOpen(null));
  }, [shareId]);

  const hang = async () => {
    if (!file) {
      setErr('choose a local file first.');
      return;
    }
    setBusy(true);
    setErr('');
    const published = await publishLocalFile(file, {
      caption: note.trim() || undefined,
      author: author.trim() || 'nightglass',
      cardTitle: title.trim() || file.name,
      color: '#0A84FF',
    });
    if (!published.ok || !published.id) {
      setBusy(false);
      setErr(published.error || 'the share table did not take the file.');
      return;
    }
    const id = uid();
    const row = {
      id,
      title: title.trim() || file.name,
      note: note.trim(),
      share_id: published.id,
      file_name: file.name,
      mime: file.type || 'application/octet-stream',
      size: file.size,
      author: author.trim() || null,
      accent: '#0A84FF',
    };
    const saved = await fetch(`${SB_URL}/rest/v1/binnacle_shelves`, {
      method: 'POST',
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(row),
    });
    setBusy(false);
    if (!saved.ok) {
      setErr('file landed in the share table, but the shelf note did not save.');
      setLink(`${location.origin}/s/${published.id}`);
      return;
    }
    setLink(`${location.origin}/nightglass/${id}`);
    setWarn(published.warn || slow);
    setFile(null);
    setTitle('');
    setNote('');
    listShelves().then(setRows).catch(() => undefined);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-24">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[11px] tracking-[0.22em] uppercase text-neutral-500 mb-3">
          listening shelf
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-3"
        >
          nightglass
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }} className="text-neutral-400 text-lg leading-relaxed max-w-xl mb-8">
          hang a local file on the share table, then leave a short listening note beside it. paste the link in discord and the card writes itself. large files are warned, never blocked.
        </motion.p>

        {open && (
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-5 mb-8">
            <p className="text-xs text-neutral-500 mb-1">open shelf</p>
            <h2 className="text-2xl font-semibold text-white tracking-tight">{open.title}</h2>
            {open.note && <p className="mt-2 text-neutral-300 leading-relaxed">{open.note}</p>}
            <p className="mt-3 text-sm text-neutral-500">{open.file_name} · {pretty(Number(open.size) || 0)}</p>
            {open.share_id && (
              <a href={`/s/${open.share_id}`} className="mt-3 inline-flex text-sm text-[#0A84FF] hover:underline">open the file</a>
            )}
          </motion.section>
        )}

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-3xl p-5 sm:p-6 mb-8"
        >
          <label className="block text-xs text-neutral-500 mb-2">local file</label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-neutral-300 file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-medium file:text-black hover:file:bg-neutral-200"
          />
          {file && (
            <p className="mt-3 text-sm text-neutral-300">
              {file.name} · {pretty(file.size)}
            </p>
          )}
          {slow && <p className="mt-2 text-sm text-amber-300/90">{slow}</p>}
          <div className="grid sm:grid-cols-2 gap-3 mt-4">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="shelf title" className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#0A84FF]/60" />
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name, optional" className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#0A84FF]/60" />
          </div>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="what should someone hear or notice?" rows={3} className="mt-3 w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#0A84FF]/60" />
          <button onClick={hang} disabled={busy} className="mt-4 inline-flex px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 active:scale-[0.98] transition disabled:opacity-50">
            {busy ? 'sending…' : 'hang on the shelf'}
          </button>
          {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
          {warn && !err && <p className="mt-3 text-sm text-amber-200/90">{warn}</p>}
          {link && (
            <p className="mt-3 text-sm">
              <a href={link} className="text-[#0A84FF] hover:underline break-all">{link}</a>
            </p>
          )}
        </motion.section>

        <section className="space-y-2">
          {rows.map((row, i) => (
            <motion.a
              key={row.id}
              href={`/nightglass/${row.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
              className="glass rounded-2xl px-4 py-3 flex items-center justify-between gap-3 hover:-translate-y-0.5 transition"
            >
              <span className="min-w-0">
                <span className="block text-sm text-white truncate">{row.title}</span>
                <span className="block text-xs text-neutral-500 truncate">{row.note || row.file_name || 'shelf note'}</span>
              </span>
              <span className="text-xs text-neutral-500 shrink-0">{pretty(Number(row.size) || 0)}</span>
            </motion.a>
          ))}
          {rows.length === 0 && <p className="text-xs text-neutral-500">the shelf is empty. the older desks are still there.</p>}
        </section>
      </main>
    </div>
  );
}
