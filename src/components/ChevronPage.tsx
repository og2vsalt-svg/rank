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
  title: string;
  bearing?: string | null;
  note?: string | null;
  author?: string | null;
  file_name?: string | null;
  file_url?: string | null;
  mime?: string | null;
  size?: number | null;
  share_id?: string | null;
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

export default function ChevronPage() {
  const { shareId, navigate } = useRouter();
  const [title, setTitle] = useState('');
  const [bearing, setBearing] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [row, setRow] = useState<Row | null>(null);
  const [recent, setRecent] = useState<Row[]>([]);
  const [copied, setCopied] = useState(false);
  const slow = useMemo(() => (file && file.size > SLOW ? `about ${pretty(file.size)}. this may take a moment. nothing is refused.` : ''), [file]);

  useEffect(() => {
    if (!shareId) {
      fetch(`${SB_URL}/rest/v1/chevron_bands?select=id,title,bearing,author,file_name,size,created_at&order=created_at.desc&limit=8`, { headers: headers() })
        .then((r) => r.json())
        .then((rows) => setRecent(Array.isArray(rows) ? rows : []))
        .catch(() => setRecent([]));
      return;
    }
    fetch(`${SB_URL}/rest/v1/chevron_bands?id=eq.${encodeURIComponent(shareId)}&select=*&limit=1`, { headers: headers() })
      .then((r) => r.json())
      .then((rows) => setRow(Array.isArray(rows) ? rows[0] || null : null))
      .catch(() => setRow(null));
  }, [shareId]);

  async function setBand() {
    if (!file || !title.trim() || !bearing.trim()) {
      setError('a title, a bearing, and a local file.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const published = await publishLocalFile(file, {
        caption: note.trim() || `${bearing.trim()} — ${title.trim()}`,
        author: author.trim(),
        cardTitle: title.trim(),
        color: '#0A84FF',
        meta: { desk: 'chevron', bearing: bearing.trim() },
      });
      if (!published.ok || !published.id) {
        setError(published.error || 'the file did not land.');
        return;
      }
      const id = published.id.slice(0, 12);
      const body = {
        id,
        title: title.trim(),
        bearing: bearing.trim(),
        note: note.trim(),
        author: author.trim() || null,
        file_name: file.name,
        file_url: published.url || published.meta?.fileUrl || null,
        mime: file.type || null,
        size: file.size,
        share_id: published.id,
      };
      const res = await fetch(`${SB_URL}/rest/v1/chevron_bands`, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
      if (!res.ok) {
        setError('the file is up, but the bearing row did not save.');
        return;
      }
      navigate('chevron', id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'something slipped.');
    } finally {
      setBusy(false);
    }
  }

  const link = row ? `${window.location.origin}/chevron/${row.id}` : '';

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="text-[13px] tracking-[0.18em] uppercase text-[#6e6e73]">
          chevron
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }} className="mt-2 text-[40px] font-semibold tracking-tight">
          A bearing, not a drawer.
        </motion.h1>
        <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-[#6e6e73]">
          Point the file somewhere. The bytes go into the share table. This page only keeps the direction and the note that travels with it.
        </p>

        {shareId && row && (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-10 rounded-[28px] bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
            <p className="text-[13px] text-[#6e6e73]">{row.bearing}</p>
            <h2 className="mt-1 text-[28px] font-semibold tracking-tight">{row.title}</h2>
            {row.note && <p className="mt-3 text-[16px] leading-relaxed">{row.note}</p>}
            <p className="mt-4 text-[13px] text-[#6e6e73]">{row.file_name} {row.size ? `· ${pretty(Number(row.size))}` : ''} {row.author ? `· ${row.author}` : ''}</p>
            {row.file_url && (
              <a href={row.file_url} className="mt-5 inline-flex rounded-full bg-[#0A84FF] px-5 py-2.5 text-[15px] font-medium text-white" download>
                Open the file
              </a>
            )}
            <button
              className="ml-3 text-[14px] text-[#0A84FF]"
              onClick={() => { navigator.clipboard.writeText(link); setCopied(true); }}
            >
              {copied ? 'copied' : 'copy link'}
            </button>
            <p className="mt-3 text-[12px] text-[#86868b]">Paste the link in Discord for a card.</p>
          </motion.section>
        )}

        {!shareId && (
          <motion.form initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mt-10 space-y-3 rounded-[28px] bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.06)]" onSubmit={(e) => { e.preventDefault(); setBand(); }}>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="what is traveling" className="w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[16px] outline-none" />
            <input value={bearing} onChange={(e) => setBearing(e.target.value)} placeholder="bearing — north stair, friday desk, a name" className="w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[16px] outline-none" />
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="the line that goes with it" rows={3} className="w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[16px] outline-none" />
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name, if you want it" className="w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[16px] outline-none" />
            <label className="block rounded-2xl border border-dashed border-black/10 px-4 py-6 text-center text-[14px] text-[#6e6e73]">
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              {file ? file.name : 'choose a local file'}
            </label>
            {slow && <p className="text-[13px] text-[#b25000]">{slow}</p>}
            {error && <p className="text-[13px] text-[#ff3b30]">{error}</p>}
            <button disabled={busy} className="rounded-full bg-[#1d1d1f] px-5 py-2.5 text-[15px] font-medium text-white disabled:opacity-50">
              {busy ? 'setting…' : 'set the bearing'}
            </button>
          </motion.form>
        )}

        {!shareId && recent.length > 0 && (
          <section className="mt-10">
            <h3 className="text-[13px] uppercase tracking-[0.16em] text-[#6e6e73]">already set</h3>
            <div className="mt-3 grid gap-2">
              {recent.map((item) => (
                <button key={item.id} onClick={() => navigate('chevron', item.id)} className="rounded-2xl bg-white px-4 py-3 text-left shadow-sm">
                  <span className="block text-[15px] font-medium">{item.title}</span>
                  <span className="text-[13px] text-[#6e6e73]">{item.bearing}</span>
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
