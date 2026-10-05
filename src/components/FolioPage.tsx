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

type Tone = 'warm' | 'cool' | 'ink';
type Folio = {
  id: string;
  title: string;
  margin: string;
  tone: Tone;
  share_id: string | null;
  file_name: string | null;
  mime: string | null;
  size: number;
  author: string | null;
  created_at: string;
};

const paper: Record<Tone, string> = {
  warm: 'bg-[#f6f1e8] text-[#1d1d1f]',
  cool: 'bg-[#eef3f8] text-[#1d1d1f]',
  ink: 'bg-[#1c1c1e] text-[#f5f5f7]',
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

async function listFolios(): Promise<Folio[]> {
  const res = await fetch(
    `${SB_URL}/rest/v1/folios?select=id,title,margin,tone,share_id,file_name,mime,size,author,created_at&order=created_at.desc&limit=10`,
    { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } },
  );
  if (!res.ok) return [];
  const rows = await res.json();
  return Array.isArray(rows) ? rows : [];
}

export default function FolioPage() {
  const { shareId, navigate } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [margin, setMargin] = useState('');
  const [author, setAuthor] = useState('');
  const [tone, setTone] = useState<Tone>('warm');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [rows, setRows] = useState<Folio[]>([]);
  const [open, setOpen] = useState<Folio | null>(null);
  const [fileUrl, setFileUrl] = useState('');

  const slow = useMemo(
    () => (file && file.size > 24 * 1024 * 1024 ? 'this file is large. the send may feel slow. nothing is refused for size.' : ''),
    [file],
  );

  useEffect(() => {
    listFolios().then(setRows).catch(() => setRows([]));
  }, []);

  useEffect(() => {
    if (!shareId) {
      setOpen(null);
      setFileUrl('');
      return;
    }
    fetch(`${SB_URL}/rest/v1/folios?id=eq.${encodeURIComponent(shareId)}&select=*&limit=1`, {
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

  async function publish() {
    if (!file) return setErr('choose a file from this machine first.');
    if (!title.trim()) return setErr('the folio needs a title.');
    setBusy(true);
    setErr('');
    const sent = await publishLocalFile(file, {
      caption: margin.trim(),
      author: author.trim(),
      cardTitle: title.trim(),
      color: tone === 'ink' ? '#1c1c1e' : tone === 'cool' ? '#64D2FF' : '#c4a574',
    });
    if (!sent.ok || !sent.id) {
      setBusy(false);
      setErr(sent.error || 'the file did not land.');
      return;
    }
    const id = uid();
    const row = {
      id,
      title: title.trim(),
      margin: margin.trim(),
      tone,
      share_id: sent.id,
      file_name: file.name,
      mime: file.type || 'application/octet-stream',
      size: file.size,
      author: author.trim() || null,
    };
    const res = await fetch(`${SB_URL}/rest/v1/folios`, {
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
      setErr('file is shared, but the margin note did not save.');
      return;
    }
    const href = `${location.origin}/folio/${id}`;
    setLink(href);
    setRows((prev) => [{ ...row, created_at: new Date().toISOString() }, ...prev]);
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif' }}>
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] tracking-wide text-black/45">
          folio · a margin, not a drawer
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-2 text-[40px] font-semibold tracking-tight">
          Leave the file with a note in the margin.
        </motion.h1>
        <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-black/60">
          One local file, a title, and a short margin. The bytes go on the share table. The note lives beside it. Paste the link in Discord for a card. Older desks stay where they are.
        </p>

        {open ? (
          <motion.article layout className={`mt-10 rounded-[28px] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.06)] ${paper[open.tone] || paper.warm}`}>
            <p className="text-[12px] uppercase tracking-[0.16em] opacity-50">{open.author || 'unsigned'}</p>
            <h2 className="mt-2 text-[28px] font-semibold tracking-tight">{open.title}</h2>
            <p className="mt-4 max-w-prose text-[17px] leading-7 opacity-80">{open.margin || 'no margin written.'}</p>
            <p className="mt-6 text-[13px] opacity-55">{open.file_name} · {pretty(Number(open.size) || 0)}</p>
            {fileUrl ? (
              <a href={fileUrl} className="mt-4 inline-flex rounded-full bg-black px-4 py-2 text-[13px] text-white" download>
                open the file
              </a>
            ) : null}
            <button className="ml-3 text-[13px] underline opacity-60" onClick={() => navigate('folio')}>back to the desk</button>
          </motion.article>
        ) : (
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 220, damping: 26 }} className="mt-10 rounded-[28px] bg-white p-6 shadow-[0_18px_50px_rgba(0,0,0,0.05)]">
            <label className="block text-[13px] text-black/50">local file</label>
            <input type="file" className="mt-2 block w-full text-[14px]" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            {slow ? <p className="mt-2 text-[13px] text-[#9a6700]">{slow}</p> : null}
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="title" className="mt-4 w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[16px] outline-none" />
            <textarea value={margin} onChange={(e) => setMargin(e.target.value)} placeholder="margin note" rows={4} className="mt-3 w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[16px] outline-none" />
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="name, if you want one" className="mt-3 w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[16px] outline-none" />
            <div className="mt-4 flex gap-2">
              {(['warm', 'cool', 'ink'] as Tone[]).map((t) => (
                <button key={t} onClick={() => setTone(t)} className={`rounded-full px-3 py-1.5 text-[13px] ${tone === t ? 'bg-black text-white' : 'bg-[#f5f5f7]'}`}>{t}</button>
              ))}
            </div>
            {err ? <p className="mt-3 text-[13px] text-[#b42318]">{err}</p> : null}
            <button disabled={busy} onClick={publish} className="mt-5 rounded-full bg-[#0071e3] px-5 py-2.5 text-[15px] text-white disabled:opacity-50">
              {busy ? 'sending…' : 'share the folio'}
            </button>
            {link ? <p className="mt-4 break-all text-[14px] text-[#0071e3]">{link}</p> : null}
          </motion.section>
        )}

        <ul className="mt-10 space-y-2">
          {rows.map((row) => (
            <li key={row.id}>
              <button onClick={() => navigate('folio', row.id)} className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5">
                <span>
                  <span className="block text-[15px] font-medium">{row.title}</span>
                  <span className="text-[12px] text-black/45">{row.file_name} · {pretty(Number(row.size) || 0)}</span>
                </span>
                <span className="text-[12px] text-black/35">{row.tone}</span>
              </button>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
