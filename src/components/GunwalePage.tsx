import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

const SB_URL = (
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  'https://tqfocdktvjuwoiyfgesb.supabase.co'
).replace(/\/$/, '');
const SB_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

type Board = {
  id: string;
  title: string;
  note: string | null;
  author: string | null;
  hue: string | null;
  share_ids: string[];
  created_at: string;
};

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function GunwalePage() {
  const { shareId } = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [hue, setHue] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState('');
  const [board, setBoard] = useState<Board | null>(null);
  const [recent, setRecent] = useState<Board[]>([]);
  const [drag, setDrag] = useState(false);

  const heavy = useMemo(() => files.reduce((n, f) => n + f.size, 0), [files]);

  const loadRecent = async () => {
    const res = await fetch(
      `${SB_URL}/rest/v1/gunwales?select=id,title,note,author,hue,share_ids,created_at&order=created_at.desc&limit=8`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } },
    );
    if (!res.ok) return;
    const rows = await res.json();
    if (Array.isArray(rows)) setRecent(rows);
  };

  const loadOne = async (id: string) => {
    const res = await fetch(
      `${SB_URL}/rest/v1/gunwales?id=eq.${encodeURIComponent(id)}&select=*&limit=1`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } },
    );
    if (!res.ok) return;
    const rows = await res.json();
    if (Array.isArray(rows) && rows[0]) setBoard(rows[0]);
  };

  useEffect(() => {
    loadRecent();
    if (shareId) loadOne(shareId);
  }, [shareId]);

  const addFiles = (list: FileList | File[] | null) => {
    if (!list) return;
    const next = Array.from(list);
    setFiles((prev) => [...prev, ...next].slice(0, 12));
    const total = next.reduce((n, f) => n + f.size, 0);
    if (total > 40 * 1024 * 1024) setWarn('this rail is heavy. it will still go up, but the tab may feel slow while it sends.');
    else if (next.some((f) => f.size > 12 * 1024 * 1024)) setWarn('one of these is large. nothing is refused. preview clients can feel slow.');
    else setWarn('');
  };

  const send = async () => {
    if (!files.length || !title.trim()) return;
    setBusy(true);
    setError('');
    const ids: string[] = [];
    for (const file of files) {
      const res = await publishLocalFile(file, {
        caption: note.trim() || undefined,
        author: author.trim() || undefined,
        color: hue,
        cardTitle: file.name,
      });
      if (!res.ok || !res.id) {
        setBusy(false);
        setError(res.error || `the share table did not take ${file.name}`);
        return;
      }
      ids.push(res.id);
      if (res.warn) setWarn(res.warn);
    }
    const id = uid();
    const row = {
      id,
      title: title.trim().slice(0, 140),
      note: note.trim() || null,
      author: author.trim() || null,
      hue,
      share_ids: ids,
    };
    const ins = await fetch(`${SB_URL}/rest/v1/gunwales`, {
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
    if (!ins.ok) {
      setError(`board ${ins.status}: ${(await ins.text()).slice(0, 180)}`);
      return;
    }
    const saved = await ins.json();
    setBoard(Array.isArray(saved) ? saved[0] : { ...row, created_at: new Date().toISOString() });
    setFiles([]);
    loadRecent();
    history.pushState(null, '', `/gunwale/${id}`);
  };

  const copy = async (value: string) => {
    try { await navigator.clipboard.writeText(value); } catch { setError(value); }
  };

  const card = board ? `${location.origin}/gunwale/${board.id}` : '';

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm font-medium mb-2 tracking-wide">gunwale</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-3">a rail for several files, not one drawer.</h1>
          <p className="text-neutral-400 max-w-xl mb-8">each local file still lands in the share table. the rail only remembers which ones belong together. paste /gunwale in Discord for the card. no size gate — only a note if the send might feel slow.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
          className={`glass rounded-3xl p-6 sm:p-8 transition ${drag ? 'ring-2 ring-[#0a84ff]/50' : ''}`}
        >
          <button type="button" onClick={() => inputRef.current?.click()} className="w-full rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-5 py-10 text-left hover:bg-white/[0.05] transition">
            <p className="text-white font-medium">{files.length ? `${files.length} file${files.length === 1 ? '' : 's'} on the rail` : 'choose local files, or drop a few here'}</p>
            <p className="text-sm text-neutral-500 mt-1">{files.length ? pretty(heavy) : 'up to twelve. each one is filed on its own'}</p>
          </button>
          <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
          {files.length > 0 && (
            <ul className="mt-4 space-y-1.5">
              {files.map((f, i) => (
                <li key={`${f.name}-${i}`} className="flex items-center justify-between text-sm text-neutral-300">
                  <span className="truncate">{f.name}</span>
                  <span className="text-neutral-500 shrink-0 ml-3">{pretty(f.size)}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="grid sm:grid-cols-2 gap-3 mt-5">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="name the rail" className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/50" />
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name, optional" className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/50" />
          </div>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="a line for the card" className="mt-3 w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/50" />
          <label className="mt-3 flex items-center gap-3 text-sm text-neutral-400">
            accent
            <input type="color" value={hue} onChange={(e) => setHue(e.target.value)} className="h-8 w-10 rounded-lg bg-transparent border-0" />
            <span className="text-xs text-neutral-500">{hue}</span>
          </label>
          {warn && <p className="mt-3 text-xs text-amber-300/90">{warn}</p>}
          {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
          <button disabled={!files.length || !title.trim() || busy} onClick={send} className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">
            {busy ? 'filing…' : 'file the rail'}
          </button>
        </motion.div>

        {board && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6 mt-5">
            <p className="text-white font-medium">{board.title}</p>
            <p className="text-sm text-neutral-400 mt-1">{board.note || 'no note'} · {board.share_ids?.length || 0} files</p>
            <p className="text-xs text-neutral-500 mt-2 break-all">{card}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              <button onClick={() => copy(card)} className="text-xs px-3 py-1.5 rounded-full bg-white text-black">copy Discord link</button>
              {(board.share_ids || []).map((id) => (
                <a key={id} href={shareUrls(id).embed} className="text-xs px-3 py-1.5 rounded-full bg-white/5 text-white">/s/{id.slice(0, 6)}</a>
              ))}
            </div>
          </motion.div>
        )}

        {recent.length > 0 && (
          <div className="mt-8">
            <p className="text-xs uppercase tracking-wide text-neutral-500 mb-3">recent rails</p>
            <div className="grid gap-2">
              {recent.map((row) => (
                <a key={row.id} href={`/gunwale/${row.id}`} className="glass rounded-2xl px-4 py-3 hover:bg-white/[0.04] transition">
                  <p className="text-white text-sm">{row.title}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{row.share_ids?.length || 0} files · {row.author || 'unsigned'}</p>
                </a>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
