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

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

type Kevel = {
  id: string;
  instruction: string;
  open_after: string | null;
  author: string | null;
  share_id: string;
  file_name: string | null;
  file_size: number;
  hue: string | null;
  created_at: string;
};

function windowLabel(value: string | null) {
  if (!value) return 'open whenever';
  const t = new Date(value);
  if (Number.isNaN(t.getTime())) return 'open whenever';
  return t.getTime() > Date.now() ? `opens ${t.toLocaleString()}` : `window open since ${t.toLocaleString()}`;
}

export default function KevelPage() {
  const { shareId } = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [instruction, setInstruction] = useState('');
  const [openAfter, setOpenAfter] = useState('');
  const [author, setAuthor] = useState('');
  const [hue, setHue] = useState('#64D2FF');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState('');
  const [row, setRow] = useState<Kevel | null>(null);
  const [recent, setRecent] = useState<Kevel[]>([]);
  const [drag, setDrag] = useState(false);

  const heavyNote = useMemo(() => {
    if (!file) return '';
    if (file.size > 80 * 1024 * 1024) return 'this file is large. it will still go up. the send may feel slow in this tab.';
    if (file.size > 12 * 1024 * 1024) return 'bigger than a quick preview. nothing is refused. the card will still publish.';
    return '';
  }, [file]);

  const loadRecent = async () => {
    const res = await fetch(
      `${SB_URL}/rest/v1/kevels?select=id,instruction,open_after,author,share_id,file_name,file_size,hue,created_at&order=created_at.desc&limit=8`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } },
    );
    if (!res.ok) return;
    const rows = await res.json();
    if (Array.isArray(rows)) setRecent(rows);
  };

  const loadOne = async (id: string) => {
    const res = await fetch(
      `${SB_URL}/rest/v1/kevels?id=eq.${encodeURIComponent(id)}&select=*&limit=1`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } },
    );
    if (!res.ok) return;
    const rows = await res.json();
    if (Array.isArray(rows) && rows[0]) setRow(rows[0]);
  };

  useEffect(() => {
    loadRecent();
    if (shareId) loadOne(shareId);
  }, [shareId]);

  const take = (next: File | null) => {
    setFile(next);
    setWarn(next && next.size > 12 * 1024 * 1024 ? 'large file. preview clients can feel slow. the desk does not turn it away.' : '');
  };

  const send = async () => {
    if (!file || !instruction.trim()) return;
    setBusy(true);
    setError('');
    const published = await publishLocalFile(file, {
      caption: instruction.trim(),
      author: author.trim() || undefined,
      color: hue,
      cardTitle: instruction.trim().slice(0, 120),
    });
    if (!published.ok || !published.id) {
      setBusy(false);
      setError(published.error || 'the share table did not take the file');
      return;
    }
    if (published.warn) setWarn(published.warn);
    const id = uid();
    const next = {
      id,
      instruction: instruction.trim().slice(0, 280),
      open_after: openAfter ? new Date(openAfter).toISOString() : null,
      author: author.trim() || null,
      share_id: published.id,
      file_name: file.name,
      file_size: file.size,
      hue,
    };
    const ins = await fetch(`${SB_URL}/rest/v1/kevels`, {
      method: 'POST',
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(next),
    });
    setBusy(false);
    if (!ins.ok) {
      setError(`note ${ins.status}: ${(await ins.text()).slice(0, 180)}. the file itself is still at /s/${published.id}`);
      return;
    }
    const saved = await ins.json();
    setRow(Array.isArray(saved) ? saved[0] : { ...next, created_at: new Date().toISOString() });
    setFile(null);
    setInstruction('');
    loadRecent();
    history.pushState(null, '', `/kevel/${id}`);
  };

  const copy = async (value: string) => {
    try { await navigator.clipboard.writeText(value); } catch { setError(value); }
  };

  const card = row ? `${location.origin}/kevel/${row.id}` : '';
  const waiting = row?.open_after ? new Date(row.open_after).getTime() > Date.now() : false;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#64d2ff] text-sm font-medium mb-2 tracking-wide">kevel</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-3">belay a file, and say when it should be opened.</h1>
          <p className="text-neutral-400 max-w-xl mb-8">not a vault. the local file lands in the share table. this desk only keeps the instruction and an open window. the window is a note, not a lock. paste /kevel in Discord for the card. large files get a warning, never a refusal.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); take(e.dataTransfer.files?.[0] || null); }}
          className={`glass rounded-3xl p-6 sm:p-8 transition ${drag ? 'ring-2 ring-[#64d2ff]/50' : ''}`}
        >
          <button type="button" onClick={() => inputRef.current?.click()} className="w-full rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-5 py-10 text-left hover:bg-white/[0.05] transition">
            <p className="text-white font-medium">{file ? file.name : 'choose a local file, or drop it here'}</p>
            <p className="text-sm text-neutral-500 mt-1">{file ? pretty(file.size) : 'one file. the bytes go to the share table'}</p>
          </button>
          <input ref={inputRef} type="file" className="hidden" onChange={(e) => take(e.target.files?.[0] || null)} />
          <input value={instruction} onChange={(e) => setInstruction(e.target.value)} placeholder="what to do when it opens" maxLength={280} className="mt-5 w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#64d2ff]/50" />
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            <label className="text-xs text-neutral-500">
              open after, optional
              <input type="datetime-local" value={openAfter} onChange={(e) => setOpenAfter(e.target.value)} className="mt-1 w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-[#64d2ff]/50" />
            </label>
            <label className="text-xs text-neutral-500">
              your name, optional
              <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="who belayed it" className="mt-1 w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-[#64d2ff]/50" />
            </label>
          </div>
          <label className="mt-3 flex items-center gap-3 text-sm text-neutral-400">
            accent
            <input type="color" value={hue} onChange={(e) => setHue(e.target.value)} className="h-8 w-10 rounded-lg bg-transparent border-0" />
            <span className="text-xs text-neutral-500">{hue}</span>
          </label>
          {(warn || heavyNote) && <p className="mt-3 text-xs text-amber-300/90">{warn || heavyNote}</p>}
          {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
          <button disabled={!file || !instruction.trim() || busy} onClick={send} className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">
            {busy ? 'belaying…' : 'belay the file'}
          </button>
        </motion.div>

        {row && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6 mt-5">
            <p className="text-white font-medium">{row.instruction}</p>
            <p className="text-sm text-neutral-400 mt-1">{row.file_name} · {pretty(Number(row.file_size) || 0)} · {windowLabel(row.open_after)}</p>
            {waiting && <p className="text-xs text-amber-200/80 mt-2">the window has not opened yet. the file is still reachable — the time is a note, not a gate.</p>}
            <p className="text-xs text-neutral-500 mt-2 break-all">{card}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              <button onClick={() => copy(card)} className="text-xs px-3 py-1.5 rounded-full bg-white text-black">copy Discord link</button>
              <a href={shareUrls(row.share_id).embed} className="text-xs px-3 py-1.5 rounded-full bg-white/5 text-white">open the file card</a>
            </div>
          </motion.div>
        )}

        {recent.length > 0 && (
          <div className="mt-8">
            <p className="text-xs uppercase tracking-wide text-neutral-500 mb-3">recent windows</p>
            <div className="grid gap-2">
              {recent.map((item) => (
                <a key={item.id} href={`/kevel/${item.id}`} className="glass rounded-2xl px-4 py-3 hover:bg-white/[0.04] transition">
                  <p className="text-white text-sm">{item.instruction}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{item.file_name || 'file'} · {windowLabel(item.open_after)}</p>
                </a>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
