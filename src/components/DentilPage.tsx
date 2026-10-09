import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';
import { publishLocalFile } from '../lib/cloudShare';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';
const SLOW = 12 * 1024 * 1024;

type Piece = { name: string; url: string; mime: string; size: number };
type Row = { id: string; title: string; margin?: string | null; author?: string | null; files?: Piece[] | null };

function pretty(n: number) {
  if (!n) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
function headers() {
  return { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };
}
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export default function DentilPage() {
  const { shareId, navigate } = useRouter();
  const [title, setTitle] = useState('');
  const [margin, setMargin] = useState('');
  const [author, setAuthor] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [row, setRow] = useState<Row | null>(null);
  const [recent, setRecent] = useState<Row[]>([]);
  const [copied, setCopied] = useState(false);
  const total = files.reduce((n, f) => n + f.size, 0);
  const slow = useMemo(() => (total > SLOW ? `about ${pretty(total)} across ${files.length} files. the strip may take a moment. nothing is refused.` : ''), [total, files.length]);

  useEffect(() => {
    if (!shareId) {
      fetch(`${SB_URL}/rest/v1/dentil_strips?select=id,title,margin,author,files,created_at&order=created_at.desc&limit=6`, { headers: headers() })
        .then((r) => r.json())
        .then((rows) => setRecent(Array.isArray(rows) ? rows : []))
        .catch(() => setRecent([]));
      return;
    }
    fetch(`${SB_URL}/rest/v1/dentil_strips?id=eq.${encodeURIComponent(shareId)}&select=*&limit=1`, { headers: headers() })
      .then((r) => r.json())
      .then((rows) => setRow(Array.isArray(rows) ? rows[0] || null : null))
      .catch(() => setRow(null));
  }, [shareId]);

  async function layStrip(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || files.length === 0) {
      setError('a title and at least one local file.');
      return;
    }
    setBusy(true);
    setError('');
    const pieces: Piece[] = [];
    for (const file of files) {
      const published = await publishLocalFile(file, { caption: margin, author, cardTitle: title.trim(), meta: { desk: 'dentil' } });
      if (!published.ok || !published.url) {
        setBusy(false);
        setError(published.error || `could not file ${file.name}.`);
        return;
      }
      pieces.push({ name: file.name, url: published.url, mime: file.type || 'application/octet-stream', size: file.size });
    }
    const id = uid();
    const res = await fetch(`${SB_URL}/rest/v1/dentil_strips`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ id, title: title.trim(), margin: margin.trim(), author: author.trim() || null, files: pieces }),
    });
    setBusy(false);
    if (!res.ok) {
      setError('the files landed, the strip note did not.');
      return;
    }
    navigate('dentil', id);
  }

  async function copyLink() {
    if (!row) return;
    await navigator.clipboard.writeText(`${location.origin}/dentil/${row.id}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  const pieces = Array.isArray(row?.files) ? row.files : [];

  return (
    <div className="min-h-screen bg-[#fbfbfd] text-[#1d1d1f]">
      <Navbar />
      <main className="mx-auto max-w-[820px] px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] uppercase tracking-[0.18em] text-[#6e6e73]">a row of blocks</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-2 text-[40px] font-semibold tracking-[-0.04em]">dentil</motion.h1>
        <p className="mt-3 max-w-[48ch] text-[17px] leading-relaxed text-[#6e6e73]">
          A strip, not a vault. Several local files sit in one row, with a margin note, and share a single link.
        </p>

        {shareId && row && (
          <motion.article initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-8 rounded-[28px] bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.05)]">
            <p className="text-[13px] text-[#6e6e73]">{row.author || 'unsigned'} · {pieces.length} blocks</p>
            <h2 className="mt-1 text-[28px] font-semibold tracking-[-0.03em]">{row.title}</h2>
            {row.margin && <p className="mt-3 text-[17px] leading-relaxed">{row.margin}</p>}
            <div className="mt-5 grid gap-2">
              {pieces.map((piece, i) => (
                <a key={`${piece.url}-${i}`} href={piece.url} className="flex items-center justify-between rounded-2xl bg-[#f5f5f7] px-4 py-3">
                  <span className="truncate text-[15px]">{piece.name}</span>
                  <span className="ml-3 shrink-0 text-[12px] text-[#6e6e73]">{pretty(piece.size || 0)}</span>
                </a>
              ))}
            </div>
            <button onClick={copyLink} className="mt-5 rounded-full bg-[#1d1d1f] px-4 py-2 text-[14px] text-white">{copied ? 'copied' : 'copy link'}</button>
            <p className="mt-3 text-[12px] text-[#6e6e73]">Discord reads this link as a card. Big strips are warned, never cut off.</p>
          </motion.article>
        )}

        {shareId && !row && <p className="mt-10 text-[15px] text-[#6e6e73]">that strip is not on the course.</p>}

        {!shareId && (
          <motion.form onSubmit={layStrip} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-3 rounded-[28px] bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.05)]">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="strip title" className="w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[16px] outline-none" />
            <textarea value={margin} onChange={(e) => setMargin(e.target.value)} placeholder="margin note" className="h-24 w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[16px] outline-none" />
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name, optional" className="w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[16px] outline-none" />
            <label className="block cursor-pointer rounded-2xl border border-dashed border-black/10 px-4 py-6 text-center text-[15px] text-[#6e6e73]">
              <input type="file" multiple className="hidden" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
              {files.length ? files.map((f) => f.name).join(', ') : 'choose local files'}
            </label>
            {slow && <p className="text-[13px] text-[#b25000]">{slow}</p>}
            {error && <p className="text-[13px] text-[#ff3b30]">{error}</p>}
            <button disabled={busy} className="rounded-full bg-[#1d1d1f] px-5 py-2.5 text-[15px] font-medium text-white disabled:opacity-50">
              {busy ? 'laying…' : 'lay the strip'}
            </button>
          </motion.form>
        )}

        {!shareId && recent.length > 0 && (
          <section className="mt-10">
            <h3 className="text-[13px] uppercase tracking-[0.16em] text-[#6e6e73]">already laid</h3>
            <div className="mt-3 grid gap-2">
              {recent.map((item) => (
                <button key={item.id} onClick={() => navigate('dentil', item.id)} className="rounded-2xl bg-white px-4 py-3 text-left shadow-sm">
                  <span className="block text-[15px] font-medium">{item.title}</span>
                  <span className="text-[13px] text-[#6e6e73]">{Array.isArray(item.files) ? item.files.length : 0} blocks</span>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
