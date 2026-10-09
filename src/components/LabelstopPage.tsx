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
  who: string;
  line?: string | null;
  author?: string | null;
  file_name?: string | null;
  file_url?: string | null;
  size?: number | null;
};

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

export default function LabelstopPage() {
  const { shareId, navigate } = useRouter();
  const [who, setWho] = useState('');
  const [line, setLine] = useState('');
  const [author, setAuthor] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [row, setRow] = useState<Row | null>(null);
  const [marks, setMarks] = useState<Row[]>([]);
  const slow = useMemo(() => (file && file.size > SLOW ? `about ${pretty(file.size)}. the stop may take a moment. nothing is refused.` : ''), [file]);

  useEffect(() => {
    fetch(`${SB_URL}/rest/v1/labelstop_marks?select=*&order=created_at.desc&limit=16`, { headers: headers() })
      .then((r) => r.json())
      .then((rows) => setMarks(Array.isArray(rows) ? rows : []))
      .catch(() => setMarks([]));
    if (!shareId) return;
    fetch(`${SB_URL}/rest/v1/labelstop_marks?id=eq.${encodeURIComponent(shareId)}&select=*&limit=1`, { headers: headers() })
      .then((r) => r.json())
      .then((rows) => setRow(Array.isArray(rows) ? rows[0] || null : null))
      .catch(() => setRow(null));
  }, [shareId]);

  async function carve() {
    if (!file || !who.trim()) {
      setError('who it stops for, and a local file.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const published = await publishLocalFile(file, {
        caption: line.trim() || `for ${who.trim()}`,
        author: author.trim(),
        cardTitle: `for ${who.trim()}`,
        color: '#FF9F0A',
        meta: { desk: 'labelstop', who: who.trim() },
      });
      if (!published.ok || !published.id) {
        setError(published.error || 'the file did not land.');
        return;
      }
      const id = published.id.slice(0, 12);
      const res = await fetch(`${SB_URL}/rest/v1/labelstop_marks`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          id,
          who: who.trim(),
          line: line.trim(),
          author: author.trim() || null,
          file_name: file.name,
          file_url: published.url || published.meta?.fileUrl || null,
          mime: file.type || null,
          size: file.size,
          share_id: published.id,
        }),
      });
      if (!res.ok) {
        setError('file is stored. the stop did not save.');
        return;
      }
      navigate('labelstop', id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'something slipped.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] tracking-[0.18em] uppercase text-[#6e6e73]">labelstop</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-[40px] font-semibold tracking-tight">Where the molding ends.</motion.h1>
        <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-[#6e6e73]">Name who the file is for. The line is carved at the stop. This is not a vault list.</p>

        {row && (
          <motion.article initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-10 rounded-[28px] bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
            <p className="text-[13px] text-[#6e6e73]">stops for</p>
            <h2 className="text-[28px] font-semibold tracking-tight">{row.who}</h2>
            {row.line && <p className="mt-3 text-[16px] leading-relaxed">{row.line}</p>}
            <p className="mt-4 text-[13px] text-[#6e6e73]">{row.file_name} {row.size ? `· ${pretty(Number(row.size))}` : ''}</p>
            {row.file_url && <a href={row.file_url} className="mt-5 inline-flex rounded-full bg-[#FF9F0A] px-5 py-2.5 text-[15px] font-medium text-[#1d1d1f]">Open the file</a>}
          </motion.article>
        )}

        <form className="mt-10 space-y-3 rounded-[28px] bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.06)]" onSubmit={(e) => { e.preventDefault(); carve(); }}>
          <input value={who} onChange={(e) => setWho(e.target.value)} placeholder="who it stops for" className="w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 outline-none" />
          <textarea value={line} onChange={(e) => setLine(e.target.value)} placeholder="the carved line" rows={3} className="w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 outline-none" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="carved by" className="w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 outline-none" />
          <label className="block rounded-2xl border border-dashed border-black/10 px-4 py-6 text-center text-[14px] text-[#6e6e73]">
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            {file ? file.name : 'choose a local file'}
          </label>
          {slow && <p className="text-[13px] text-[#b25000]">{slow}</p>}
          {error && <p className="text-[13px] text-[#ff3b30]">{error}</p>}
          <button disabled={busy} className="rounded-full bg-[#1d1d1f] px-5 py-2.5 text-white disabled:opacity-50">{busy ? 'carving…' : 'carve the stop'}</button>
        </form>

        <ul className="mt-8 divide-y divide-black/5 overflow-hidden rounded-[24px] bg-white">
          {marks.map((item) => (
            <li key={item.id}>
              <button onClick={() => navigate('labelstop', item.id)} className="flex w-full items-center justify-between px-4 py-3 text-left">
                <span>
                  <span className="block text-[15px] font-medium">{item.who}</span>
                  <span className="text-[13px] text-[#6e6e73]">{item.line}</span>
                </span>
                <span className="text-[12px] text-[#86868b]">open</span>
              </button>
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </div>
  );
}
