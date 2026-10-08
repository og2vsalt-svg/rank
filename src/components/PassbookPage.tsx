import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { publishLocalFile } from '../lib/cloudShare';

const SB_URL = (
  (import.meta as any).env?.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co'
).replace(/\/$/, '');
const SB_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Book = {
  id: string;
  share_id?: string | null;
  recipient?: string | null;
  receipt?: string | null;
  file_name?: string | null;
  mime?: string | null;
  size?: number | null;
  file_url?: string | null;
  accent?: string | null;
  author?: string | null;
  created_at?: string | null;
};

function formatBytes(n: number) {
  if (!n) return '0 b';
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(2) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

async function loadBooks(): Promise<Book[]> {
  const res = await fetch(
    `${SB_URL}/rest/v1/passbooks?select=*&order=created_at.desc&limit=18`,
    { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } },
  );
  if (!res.ok) return [];
  const rows = await res.json();
  return Array.isArray(rows) ? rows : [];
}

async function loadOne(id: string): Promise<Book | null> {
  const res = await fetch(
    `${SB_URL}/rest/v1/passbooks?id=eq.${encodeURIComponent(id)}&select=*&limit=1`,
    { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } },
  );
  if (!res.ok) return null;
  const rows = await res.json();
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

export default function PassbookPage() {
  const { shareId, navigate } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [recipient, setRecipient] = useState('');
  const [receipt, setReceipt] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [open, setOpen] = useState<Book | null>(null);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (shareId) {
        const row = await loadOne(shareId);
        if (!cancelled) setOpen(row);
      } else if (!cancelled) setOpen(null);
      const list = await loadBooks();
      if (!cancelled) setBooks(list);
    })();
    return () => {
      cancelled = true;
    };
  }, [shareId]);

  const slow = useMemo(() => (file && file.size > 25 * 1024 * 1024 ? 'this drop is large. the send may feel slow. nothing is refused for size.' : ''), [file]);

  const stamp = async () => {
    if (!file) {
      setErr('choose a local file first.');
      return;
    }
    setBusy(true);
    setErr('');
    setWarn(slow);
    const published = await publishLocalFile(file, {
      caption: receipt || `for ${recipient || 'the desk'}`,
      author: author || undefined,
      cardTitle: recipient ? `for ${recipient}` : file.name,
      color: '#64D2FF',
    });
    if (!published.ok || !published.id) {
      setBusy(false);
      setErr(published.error || 'the file did not land.');
      return;
    }
    const row = {
      id: published.id,
      share_id: published.id,
      recipient: recipient.slice(0, 80),
      receipt: receipt.slice(0, 240),
      file_name: file.name,
      mime: file.type || 'application/octet-stream',
      size: file.size,
      file_url: published.url,
      accent: '#64D2FF',
      author: author.slice(0, 60) || null,
    };
    const ins = await fetch(`${SB_URL}/rest/v1/passbooks`, {
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
      setErr('file is shared, but the passbook row did not save. the /s link still works.');
      navigate('share', published.id);
      return;
    }
    if (published.warn) setWarn(published.warn);
    setFile(null);
    navigate('passbook', published.id);
  };

  const link = open ? `${window.location.origin}/passbook/${open.id}` : '';

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-24 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[13px] tracking-[0.18em] uppercase text-[#64d2ff]/80 mb-3">passbook</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white">A receipt, not a cabinet.</h1>
          <p className="mt-4 text-[15px] leading-relaxed text-neutral-400 max-w-xl">
            Drop a local file, write who it is for, and stamp a short receipt. The bytes go to storage and a row in the passbook table. Paste the link in Discord for a card.
          </p>
        </motion.div>

        {open ? (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-10 glass rounded-3xl p-6 sm:p-8">
            <p className="text-xs text-[#64d2ff] mb-2">stamped</p>
            <h2 className="text-2xl font-semibold tracking-tight">{open.recipient ? `for ${open.recipient}` : open.file_name}</h2>
            <p className="mt-2 text-sm text-neutral-400">{open.receipt || 'no receipt line'}</p>
            <p className="mt-3 text-xs text-neutral-500">{open.file_name} · {formatBytes(Number(open.size) || 0)} · {open.author || 'unsigned'}</p>
            {open.mime?.startsWith('image/') && open.file_url && <img src={open.file_url} alt="" className="mt-5 w-full rounded-2xl" />}
            <div className="mt-5 flex flex-wrap gap-2">
              {open.file_url && <a href={open.file_url} download={open.file_name || 'file'} className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium">download</a>}
              <button onClick={async () => { await navigator.clipboard.writeText(link); setCopied(link); }} className="px-4 py-2 rounded-full bg-white/8 text-sm">copy discord link</button>
              <button onClick={() => navigate('passbook')} className="px-4 py-2 rounded-full bg-white/5 text-sm text-neutral-300">new stamp</button>
            </div>
            {copied && <p className="mt-3 text-xs text-neutral-500 break-all">{copied}</p>}
          </motion.section>
        ) : (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-10 glass rounded-3xl p-6 sm:p-8">
            <label className="block rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-8 text-center cursor-pointer hover:bg-white/[0.05] transition-colors">
              <input type="file" className="sr-only" onChange={(e) => { setFile(e.target.files?.[0] || null); setErr(''); }} />
              <span className="text-sm text-neutral-300">{file ? file.name : 'choose a file from this machine'}</span>
              {file && <span className="block mt-1 text-xs text-neutral-500">{formatBytes(file.size)}</span>}
            </label>
            {(slow || warn) && <p className="mt-3 text-xs text-amber-200/80">{warn || slow}</p>}
            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              <input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="who it is for" className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none" />
              <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name, optional" className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none" />
            </div>
            <textarea value={receipt} onChange={(e) => setReceipt(e.target.value)} placeholder="a short receipt line" rows={3} className="mt-3 w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none resize-none" />
            {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
            <button disabled={busy} onClick={stamp} className="mt-4 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50">
              {busy ? 'stamping…' : 'stamp and share'}
            </button>
          </motion.section>
        )}

        <section className="mt-12">
          <h3 className="text-sm text-neutral-500 mb-3">recent stamps</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {books.map((b) => (
              <button key={b.id} onClick={() => navigate('passbook', b.id)} className="text-left glass rounded-2xl p-4 hover:bg-white/[0.06] transition-colors">
                <p className="text-sm font-medium text-white truncate">{b.recipient ? `for ${b.recipient}` : b.file_name}</p>
                <p className="mt-1 text-xs text-neutral-500 truncate">{b.receipt || b.file_name}</p>
              </button>
            ))}
            {!books.length && <p className="text-sm text-neutral-500">no stamps yet.</p>}
          </div>
        </section>
      </main>
    </div>
  );
}
