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

type Line = { text: string; done: boolean };
type Slate = {
  id: string;
  title: string;
  lines: Line[];
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

export default function SlatePage() {
  const { shareId, navigate } = useRouter();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [lines, setLines] = useState<Line[]>([
    { text: '', done: false },
    { text: '', done: false },
    { text: '', done: false },
  ]);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [rows, setRows] = useState<Slate[]>([]);
  const [open, setOpen] = useState<Slate | null>(null);
  const [fileUrl, setFileUrl] = useState('');
  const slow = useMemo(
    () => (file && file.size > 24 * 1024 * 1024 ? 'large attachment. it may send slowly. it will not be refused for size.' : ''),
    [file],
  );

  useEffect(() => {
    fetch(`${SB_URL}/rest/v1/slates?select=*&order=created_at.desc&limit=10`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    })
      .then((r) => r.json())
      .then((rows) => setRows(Array.isArray(rows) ? rows : []))
      .catch(() => setRows([]));
  }, []);

  useEffect(() => {
    if (!shareId) {
      setOpen(null);
      setFileUrl('');
      return;
    }
    fetch(`${SB_URL}/rest/v1/slates?id=eq.${encodeURIComponent(shareId)}&select=*&limit=1`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    })
      .then((r) => r.json())
      .then(async (rows) => {
        const row = Array.isArray(rows) ? rows[0] : null;
        setOpen(row || null);
        if (!row?.share_id) return;
        const share = await fetch(
          `${SB_URL}/rest/v1/public_shares?id=eq.${encodeURIComponent(row.share_id)}&select=file_url&limit=1`,
          { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } },
        ).then((r) => r.json());
        setFileUrl(share?.[0]?.file_url || '');
      })
      .catch(() => setOpen(null));
  }, [shareId]);

  function setLine(i: number, text: string) {
    setLines((prev) => prev.map((line, idx) => (idx === i ? { ...line, text } : line)));
  }

  async function publish() {
    const kept = lines.map((l) => ({ text: l.text.trim(), done: false })).filter((l) => l.text);
    if (!title.trim()) return setErr('name the slate.');
    if (!kept.length && !file) return setErr('add a line, or attach a file.');
    setBusy(true);
    setErr('');
    let shareIdOut: string | null = null;
    if (file) {
      const sent = await publishLocalFile(file, {
        caption: kept.map((l) => l.text).join(' · '),
        author: author.trim(),
        cardTitle: title.trim(),
        color: '#0A84FF',
      });
      if (!sent.ok || !sent.id) {
        setBusy(false);
        setErr(sent.error || 'the attachment did not land.');
        return;
      }
      shareIdOut = sent.id;
    }
    const id = uid();
    const row = {
      id,
      title: title.trim(),
      lines: kept,
      share_id: shareIdOut,
      file_name: file?.name || null,
      mime: file?.type || null,
      size: file?.size || 0,
      author: author.trim() || null,
    };
    const res = await fetch(`${SB_URL}/rest/v1/slates`, {
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
    if (!res.ok) {
      setErr('the slate did not save.');
      return;
    }
    setLink(`${location.origin}/slate/${id}`);
    setRows((prev) => [{ ...row, created_at: new Date().toISOString() }, ...prev]);
  }

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-[#f5f5f7]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}>
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[13px] text-white/40">slate · a list with an optional file</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-[40px] font-semibold tracking-tight">
          A short list. A file if you need one.
        </motion.h1>
        <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-white/55">
          Not a cabinet. Three lines, a name, and an optional local file on the share table. Discord cards the link. Size is warned, never capped.
        </p>
        {open ? (
          <motion.article initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="mt-10 rounded-[28px] border border-white/10 bg-white/5 p-7 backdrop-blur-xl">
            <p className="text-[12px] uppercase tracking-[0.16em] text-white/40">{open.author || 'unsigned'}</p>
            <h2 className="mt-2 text-[28px] font-semibold">{open.title}</h2>
            <ul className="mt-5 space-y-2">
              {(open.lines || []).map((line, i) => (
                <li key={i} className="rounded-2xl bg-white/5 px-4 py-3 text-[16px]">{line.text}</li>
              ))}
            </ul>
            {open.file_name ? <p className="mt-4 text-[13px] text-white/45">{open.file_name} · {pretty(Number(open.size) || 0)}</p> : null}
            {fileUrl ? <a className="mt-4 inline-flex rounded-full bg-[#0A84FF] px-4 py-2 text-[13px]" href={fileUrl}>open attachment</a> : null}
            <button className="ml-3 text-[13px] text-white/50 underline" onClick={() => navigate('slate')}>back</button>
          </motion.article>
        ) : (
          <section className="mt-10 rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="slate title" className="w-full rounded-2xl bg-black/40 px-4 py-3 outline-none" />
            {lines.map((line, i) => (
              <input key={i} value={line.text} onChange={(e) => setLine(i, e.target.value)} placeholder={`line ${i + 1}`} className="mt-3 w-full rounded-2xl bg-black/40 px-4 py-3 outline-none" />
            ))}
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="from" className="mt-3 w-full rounded-2xl bg-black/40 px-4 py-3 outline-none" />
            <label className="mt-4 block text-[13px] text-white/40">optional local file</label>
            <input type="file" className="mt-2 block text-[14px]" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            {slow ? <p className="mt-2 text-[13px] text-[#ffd60a]">{slow}</p> : null}
            {err ? <p className="mt-3 text-[13px] text-[#ff6b6b]">{err}</p> : null}
            <button disabled={busy} onClick={publish} className="mt-5 rounded-full bg-white px-5 py-2.5 text-[15px] font-medium text-black disabled:opacity-50">
              {busy ? 'sending…' : 'share the slate'}
            </button>
            {link ? <p className="mt-4 break-all text-[14px] text-[#64d2ff]">{link}</p> : null}
          </section>
        )}
        <ul className="mt-8 space-y-2">
          {rows.map((row) => (
            <li key={row.id}>
              <button onClick={() => navigate('slate', row.id)} className="w-full rounded-2xl border border-white/10 px-4 py-3 text-left transition hover:bg-white/5">
                <span className="block text-[15px]">{row.title}</span>
                <span className="text-[12px] text-white/40">{(row.lines || []).length} lines{row.file_name ? ` · ${row.file_name}` : ''}</span>
              </button>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
