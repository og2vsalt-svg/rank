import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';
import { publishLocalFile } from '../lib/cloudShare';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';
const SLOW = 12 * 1024 * 1024;

type Row = {
  id: string;
  left_note: string;
  right_note: string;
  share_id?: string | null;
  file_name?: string | null;
  author?: string | null;
  created_at?: string;
};

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
function headers() {
  return {
    apikey: SB_KEY,
    Authorization: `Bearer ${SB_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
}

export default function SpandrelPage() {
  const { shareId, navigate } = useRouter();
  const [left, setLeft] = useState('');
  const [right, setRight] = useState('');
  const [author, setAuthor] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [row, setRow] = useState<Row | null>(null);
  const [recent, setRecent] = useState<Row[]>([]);
  const [copied, setCopied] = useState(false);
  const slow = useMemo(
    () => (file && file.size > SLOW ? `about ${pretty(file.size)}. the tab may feel slow. nothing is refused.` : ''),
    [file],
  );

  useEffect(() => {
    if (shareId) return;
    fetch(`${SB_URL}/rest/v1/spandrels?select=id,left_note,right_note,file_name,author,created_at&order=created_at.desc&limit=6`, {
      headers: headers(),
    })
      .then((r) => r.json())
      .then((rows) => setRecent(Array.isArray(rows) ? rows : []))
      .catch(() => setRecent([]));
  }, [shareId]);

  useEffect(() => {
    if (!shareId) return;
    fetch(`${SB_URL}/rest/v1/spandrels?id=eq.${encodeURIComponent(shareId)}&select=*&limit=1`, { headers: headers() })
      .then((r) => r.json())
      .then((rows) => setRow(Array.isArray(rows) ? rows[0] || null : null))
      .catch(() => setError('could not open that spandrel'));
  }, [shareId]);

  async function fileIt() {
    if (!left.trim() || !right.trim()) {
      setError('write both sides of the arch');
      return;
    }
    if (!file) {
      setError('pick a local file. it lands in the share table');
      return;
    }
    setBusy(true);
    setError('');
    const sent = await publishLocalFile(file, {
      caption: `${left.trim()} / ${right.trim()}`,
      author: author.trim() || undefined,
      cardTitle: left.trim().slice(0, 80),
      color: '#E8E4DC',
    });
    if (!sent.ok || !sent.id) {
      setBusy(false);
      setError(sent.error || 'the file did not land');
      return;
    }
    const id = uid();
    const body = {
      id,
      left_note: left.trim(),
      right_note: right.trim(),
      share_id: sent.id,
      file_name: file.name,
      author: author.trim() || null,
    };
    const ins = await fetch(`${SB_URL}/rest/v1/spandrels`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!ins.ok) {
      setError('file is in the share table, but the spandrel row did not save');
      return;
    }
    const saved = await ins.json();
    const next = Array.isArray(saved) ? saved[0] : body;
    setRow(next);
    navigate('spandrel', id);
  }

  const link = row ? `${location.origin}/spandrel/${row.id}` : '';
  const fileLink = row?.share_id ? `${location.origin}/s/${row.share_id}` : '';

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7]">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[12px] uppercase tracking-[0.18em] text-white/40">
          beside the arch
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mt-2 text-4xl font-semibold tracking-tight"
        >
          Spandrel
        </motion.h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/60">
          Two short notes that frame one file. The bytes go into the share table. This page only keeps the left and right lines. Not a vault drawer. Large drops are warned, never refused.
        </p>
        {row ? (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <p className="rounded-2xl bg-black/30 p-4 text-[15px] leading-relaxed">{row.left_note}</p>
              <p className="rounded-2xl bg-black/30 p-4 text-[15px] leading-relaxed">{row.right_note}</p>
            </div>
            <p className="mt-4 text-sm text-white/45">
              {row.file_name || 'file'}
              {row.author ? ` · ${row.author}` : ''}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(link);
                  setCopied(true);
                }}
                className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-neutral-200"
              >
                {copied ? 'copied' : 'copy spandrel link'}
              </button>
              {fileLink && (
                <a href={fileLink} className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/5">
                  open the file
                </a>
              )}
            </div>
            <p className="mt-4 text-xs text-white/35">Paste this link in Discord. The card uses both lines, and the image if the file is one.</p>
          </motion.section>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={(e) => {
              e.preventDefault();
              fileIt();
            }}
            className="mt-8 space-y-3 rounded-3xl border border-white/10 bg-white/[0.04] p-6"
          >
            <input
              value={left}
              onChange={(e) => setLeft(e.target.value.slice(0, 280))}
              placeholder="left of the file"
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-[15px] outline-none focus:border-white/30"
            />
            <input
              value={right}
              onChange={(e) => setRight(e.target.value.slice(0, 280))}
              placeholder="right of the file"
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-[15px] outline-none focus:border-white/30"
            />
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value.slice(0, 60))}
              placeholder="your name, optional"
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-[15px] outline-none focus:border-white/30"
            />
            <label className="block cursor-pointer rounded-2xl border border-dashed border-white/15 px-4 py-6 text-sm text-white/55 transition hover:border-white/30">
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              {file ? `${file.name} · ${pretty(file.size)}` : 'choose a local file'}
            </label>
            {slow && <p className="text-xs text-amber-200/90">{slow}</p>}
            {error && <p className="text-xs text-red-300">{error}</p>}
            <button disabled={busy} className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:opacity-50">
              {busy ? 'filing…' : 'file the spandrel'}
            </button>
          </motion.form>
        )}
        {!row && recent.length > 0 && (
          <ul className="mt-8 space-y-2">
            {recent.map((item) => (
              <li key={item.id}>
                <a href={`/spandrel/${item.id}`} className="block rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/70 hover:bg-white/5">
                  {item.left_note} / {item.right_note}
                </a>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  );
}
