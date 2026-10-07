import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';
import { publishLocalFile } from '../lib/cloudShare';

const SB_URL = (
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  'https://tqfocdktvjuwoiyfgesb.supabase.co'
).replace(/\/$/, '');
const SB_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Piece = { id: string; name: string; mime: string; size: number; url: string };

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

async function loadSatchel(id: string) {
  const res = await fetch(`${SB_URL}/rest/v1/satchels?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
  });
  if (!res.ok) return null;
  const rows = await res.json();
  return rows[0] || null;
}

export default function SatchelPage() {
  const { shareId } = useRouter();
  const [title, setTitle] = useState('weekend bag');
  const [cover, setCover] = useState('');
  const [author, setAuthor] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [link, setLink] = useState('');
  const [bag, setBag] = useState<any>(null);

  useEffect(() => {
    if (!shareId) return;
    loadSatchel(shareId).then(setBag);
  }, [shareId]);

  const slow = useMemo(() => files.some((file) => file.size > 40 * 1024 * 1024) || files.reduce((n, file) => n + file.size, 0) > 80 * 1024 * 1024, [files]);

  async function pack() {
    setError('');
    if (!title.trim() || !files.length) {
      setError('name the bag and drop at least one file.');
      return;
    }
    setBusy(true);
    try {
      const pieces: Piece[] = [];
      for (const file of files) {
        const sent = await publishLocalFile(file, { caption: cover, author, color: accent, cardTitle: file.name });
        if (!sent.ok || !sent.id || !sent.url) throw new Error(sent.error || `could not file ${file.name}`);
        pieces.push({ id: sent.id, name: file.name, mime: file.type || 'application/octet-stream', size: file.size, url: sent.url });
      }
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const row = { id, title: title.trim(), cover: cover.trim() || null, author: author.trim() || null, accent, pieces };
      const saved = await fetch(`${SB_URL}/rest/v1/satchels`, {
        method: 'POST',
        headers: {
          apikey: SB_KEY,
          Authorization: `Bearer ${SB_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(row),
      });
      if (!saved.ok) throw new Error((await saved.text()).slice(0, 180) || 'bag row failed');
      const href = `${location.origin}/satchel/${id}`;
      setLink(href);
      setBag(row);
    } catch (err: any) {
      setError(err?.message || 'could not pack the bag');
    } finally {
      setBusy(false);
    }
  }

  const pieces: Piece[] = Array.isArray(bag?.pieces) ? bag.pieces : [];

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-24 pb-20">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] tracking-wide text-[#0a84ff]">satchel</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-2 text-4xl font-semibold tracking-tight">One bag. Several files.</motion.h1>
        <p className="mt-3 text-[15px] leading-relaxed text-white/60 max-w-xl">Not the vault. Pick files from this machine, file each one into the share table, and keep the bag as a single Discord card. Nothing is refused for size — a large drop only warns that the browser may pause.</p>

        {shareId && bag && (
          <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-xl font-medium">{bag.title}</h2>
            {bag.cover && <p className="mt-2 text-sm text-white/60">{bag.cover}</p>}
            <ul className="mt-4 space-y-2">
              {pieces.map((piece) => (
                <li key={piece.id} className="flex items-center justify-between gap-3 rounded-2xl bg-black/30 px-3 py-2 text-sm">
                  <a className="truncate hover:text-[#0a84ff]" href={piece.url} target="_blank" rel="noreferrer">{piece.name}</a>
                  <span className="shrink-0 text-white/40">{pretty(piece.size || 0)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-8 rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <label className="block text-xs text-white/45">bag name</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-2xl bg-black/40 border border-white/10 px-3 py-2.5 outline-none focus:border-[#0a84ff]" />
          <label className="block mt-4 text-xs text-white/45">cover line</label>
          <input value={cover} onChange={(e) => setCover(e.target.value)} placeholder="what is in here" className="mt-1 w-full rounded-2xl bg-black/40 border border-white/10 px-3 py-2.5 outline-none focus:border-[#0a84ff]" />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/45">from</label>
              <input value={author} onChange={(e) => setAuthor(e.target.value)} className="mt-1 w-full rounded-2xl bg-black/40 border border-white/10 px-3 py-2.5 outline-none focus:border-[#0a84ff]" />
            </div>
            <div>
              <label className="block text-xs text-white/45">card accent</label>
              <input value={accent} onChange={(e) => setAccent(e.target.value)} className="mt-1 w-full rounded-2xl bg-black/40 border border-white/10 px-3 py-2.5 outline-none focus:border-[#0a84ff]" />
            </div>
          </div>
          <label className="mt-4 flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-white/15 px-4 py-8 text-sm text-white/70 hover:border-[#0a84ff]/60 transition-colors">
            <input type="file" multiple className="hidden" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
            {files.length ? `${files.length} file${files.length === 1 ? '' : 's'} ready · ${pretty(files.reduce((n, file) => n + file.size, 0))}` : 'choose local files'}
          </label>
          {slow && <p className="mt-3 text-xs text-amber-300">this bag is heavy. sending may feel slow. there is no size cap.</p>}
          {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
          <button disabled={busy} onClick={pack} className="mt-4 rounded-full bg-[#0a84ff] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50 transition-transform active:scale-[0.98]">
            {busy ? 'packing…' : 'pack and share'}
          </button>
          {link && (
            <p className="mt-4 text-sm break-all text-white/80">
              Discord card: <a className="text-[#0a84ff]" href={link}>{link}</a>
            </p>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
