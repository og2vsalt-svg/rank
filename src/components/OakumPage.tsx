import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';

const SB_URL = (
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  'https://tqfocdktvjuwoiyfgesb.supabase.co'
).replace(/\/$/, '');
const SB_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

type Seam = {
  id: string;
  seam: string;
  share_a: string | null;
  share_b: string | null;
  author: string | null;
  created_at: string;
};

async function fileLocal(file: File, author: string) {
  const body = new FormData();
  body.append('file', file, file.name);
  if (author) body.append('author', author);
  body.append('caption', 'oakum');
  const res = await fetch('/api/share', { method: 'POST', body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `share ${res.status}`);
  return data as { id: string; warn?: string | null };
}

export default function OakumPage() {
  const { shareId } = useRouter();
  const [seam, setSeam] = useState('');
  const [author, setAuthor] = useState('');
  const [left, setLeft] = useState<File | null>(null);
  const [right, setRight] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState('');
  const [row, setRow] = useState<Seam | null>(null);
  const [recent, setRecent] = useState<Seam[]>([]);

  const loadRecent = async () => {
    const res = await fetch(
      `${SB_URL}/rest/v1/oakums?select=id,seam,share_a,share_b,author,created_at&order=created_at.desc&limit=8`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } },
    );
    if (!res.ok) return;
    const rows = await res.json();
    if (Array.isArray(rows)) setRecent(rows);
  };

  const loadOne = async (id: string) => {
    const res = await fetch(
      `${SB_URL}/rest/v1/oakums?id=eq.${encodeURIComponent(id)}&select=*&limit=1`,
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

  const slow = [left, right].filter(Boolean).some((file) => (file as File).size > 12 * 1024 * 1024);

  const send = async () => {
    if (!seam.trim() || !left) return;
    setBusy(true);
    setError('');
    setWarn('');
    try {
      const a = await fileLocal(left, author.trim());
      const b = right ? await fileLocal(right, author.trim()) : null;
      const id = uid();
      const next = {
        id,
        seam: seam.trim().slice(0, 280),
        share_a: a.id,
        share_b: b?.id || null,
        author: author.trim() || null,
      };
      const ins = await fetch(`${SB_URL}/rest/v1/oakums`, {
        method: 'POST',
        headers: {
          apikey: SB_KEY,
          Authorization: `Bearer ${SB_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(next),
      });
      if (!ins.ok) throw new Error(`oakum ${ins.status}: ${(await ins.text()).slice(0, 160)}`);
      const saved = await ins.json();
      setRow(Array.isArray(saved) ? saved[0] : { ...next, created_at: new Date().toISOString() });
      setWarn([a.warn, b?.warn].filter(Boolean).join(' '));
      setSeam('');
      setLeft(null);
      setRight(null);
      loadRecent();
      history.pushState(null, '', `/oakum/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'could not caulk');
    } finally {
      setBusy(false);
    }
  };

  const copy = async (value: string) => {
    try { await navigator.clipboard.writeText(value); } catch { setError(value); }
  };

  const card = row ? `${location.origin}/oakum/${row.id}` : '';

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#64d2ff] text-sm font-medium mb-2 tracking-wide">oakum</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-3">stuff the seam.</h1>
          <p className="text-neutral-400 max-w-xl mb-8">two locals, or one, go into the share table. the sentence is what fills the gap between them. not a vault drawer. paste /oakum in Discord for the card. older desks stay put.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-3xl p-6 sm:p-8">
          <textarea value={seam} onChange={(e) => setSeam(e.target.value)} placeholder="what sits between the two files" maxLength={280} rows={3} className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#64d2ff]/50 resize-none" />
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            <label className="text-xs text-neutral-500">
              first file
              <input type="file" onChange={(e) => setLeft(e.target.files?.[0] || null)} className="mt-1 block w-full text-sm text-neutral-300 file:mr-3 file:rounded-full file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-xs file:text-black" />
            </label>
            <label className="text-xs text-neutral-500">
              second file, optional
              <input type="file" onChange={(e) => setRight(e.target.files?.[0] || null)} className="mt-1 block w-full text-sm text-neutral-300 file:mr-3 file:rounded-full file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-xs file:text-black" />
            </label>
          </div>
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name, optional" className="mt-3 w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-[#64d2ff]/50" />
          {slow && <p className="mt-3 text-xs text-amber-200/90">large drop. the tab may feel slow. nothing is refused.</p>}
          {warn && <p className="mt-3 text-xs text-amber-200/90">{warn}</p>}
          {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
          <button disabled={!seam.trim() || !left || busy} onClick={send} className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 active:scale-[0.98] transition">
            {busy ? 'caulking…' : 'file the seam'}
          </button>
        </motion.div>

        {row && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6 mt-5">
            <p className="text-white font-medium">{row.seam}</p>
            <p className="text-sm text-neutral-400 mt-1">{row.share_a}{row.share_b ? ` · ${row.share_b}` : ''}{row.author ? ` · ${row.author}` : ''}</p>
            <p className="text-xs text-neutral-500 mt-2 break-all">{card}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              <button onClick={() => copy(card)} className="text-xs px-3 py-1.5 rounded-full bg-white text-black">copy Discord link</button>
              {row.share_a && <a href={`/s/${row.share_a}`} className="text-xs px-3 py-1.5 rounded-full glass text-neutral-200">first file</a>}
              {row.share_b && <a href={`/s/${row.share_b}`} className="text-xs px-3 py-1.5 rounded-full glass text-neutral-200">second file</a>}
            </div>
          </motion.div>
        )}

        {recent.length > 0 && (
          <div className="mt-8">
            <p className="text-xs uppercase tracking-wide text-neutral-500 mb-3">recent seams</p>
            <div className="grid gap-2">
              {recent.map((item, i) => (
                <motion.a key={item.id} href={`/oakum/${item.id}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="glass rounded-2xl px-4 py-3 hover:bg-white/[0.04] transition duration-200">
                  <p className="text-white text-sm">{item.seam}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{item.share_b ? 'two files' : 'one file'}</p>
                </motion.a>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
